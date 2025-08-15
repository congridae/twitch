import type { Helix } from "./helix.ts";
import { CreateEventSubSubscription } from "./endpoints.ts";
import type {
	Message,
	MessageType,
	NotificationPayload,
	ReconnectPayload,
	WelcomeMessage,
} from "./messages.ts";
import type { Subscription } from "./subscriptions.ts";
import { Mutex, TwitchError, type TwitchLogger } from "./utils.ts";

export class EventSub {
	helix: Helix;
	conn: EventSubConnection | undefined;
	notify: Map<string, (event: unknown) => void>;
	resub: ({
		type: string;
		version: string;
		condition: unknown;
		id: string;
	})[];
	mutex: Mutex;
	logger: TwitchLogger;

	constructor(
		helix: Helix,
	) {
		this.helix = helix;
		this.notify = new Map();
		this.resub = [];
		this.mutex = new Mutex();
		this.logger = helix.logger;
	}

	async connect(url?: string) {
		this.disconnect();
		this.conn = undefined;
		const ws = new WebSocket(
			url ??
				(this.helix.mockServer
					? `ws://127.0.0.1:${this.helix.mockServer}/ws`
					: "wss://eventsub.wss.twitch.tv/ws"),
		);
		// wait for connection
		let timeout;
		await new Promise((resolve, reject) => {
			ws.onopen = resolve;
			ws.onerror = reject;
			ws.onclose = reject;
			timeout = setTimeout(
				() => reject(new TwitchError("Timed out waiting for connection")),
				10_000,
			);
		});
		if (timeout !== undefined) clearTimeout(timeout);
		// wait for welcome
		const welcome: WelcomeMessage = await new Promise(
			(resolve, reject) => {
				ws.onmessage = (ev) => resolve(JSON.parse(ev.data));
				ws.onerror = reject;
				ws.onclose = reject;
				timeout = setTimeout(
					() => reject(new TwitchError("Timed out waiting for welcome")),
					10_000,
				);
			},
		);
		if (timeout !== undefined) clearTimeout(timeout);
		const sessionId = welcome.payload.session.id;
		this.conn = {
			ws,
			sessionId,
		};
		ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
		// someones gotta fix this type at some point. not me though
		ws.onerror = (err) => this.onError(err as unknown as Error);
		ws.onclose = () => this.onClose();
	}

	disconnect() {
		if (this.conn) {
			this.conn.ws.onmessage = null;
			this.conn.ws.onerror = null;
			this.conn.ws.onclose = null;
			this.conn.ws.close();
			this.conn = undefined;
		}
	}

	private async onMessage(msg: Message) {
		switch (msg.metadata.message_type as MessageType) {
			case "notification": {
				const payload = msg.payload as NotificationPayload;
				const callback = this.notify.get(payload.subscription.id);
				if (callback === undefined) {
					this.logger
						.warning(
							`got notification for unknown subscription ${payload.subscription.id}`,
						);
					return;
				}
				callback(payload.event);
				break;
			}
			case "session_reconnect": {
				const unlock = await this.mutex.lock();
				try {
					const payload = msg.payload as ReconnectPayload;
					await this.connect(payload.session.reconnect_url);
				} finally {
					unlock();
				}
				break;
			}
		}
	}

	private async onError(err: Error) {
		this.logger.error(`connection error: ${err}`);
		await this.reconnect(await this.mutex.lock());
	}

	private async onClose() {
		this.logger.error("unexpected close");
		await this.reconnect(await this.mutex.lock());
	}

	private async reconnect(unlock: () => void) {
		try {
			await this.connect();
			await this.resubscribe();
			unlock();
		} catch (err) {
			this.logger.error(`error reconnecting: ${err}`);
			setTimeout(this.reconnect.bind(this), 1_000);
		}
	}

	private async subscribe_(
		type: string,
		version: string,
		condition: object,
	): Promise<string> {
		const response = await this.helix.call(
			CreateEventSubSubscription,
			undefined,
			{
				type,
				version,
				condition,
				transport: {
					method: "websocket",
					session_id: this.conn!.sessionId,
				},
			},
		);
		const created = response.data[0]; // just in case my one event is actually two events in a trenchcoat i guess
		this.logger.debug(
			`created subscription for ${type}.${version} as ${created.id}`,
		);
		return created.id;
	}

	async subscribe<Condition extends object, Payload>(
		subscription: Subscription<Condition, Payload>,
		condition: Condition,
		callback: (event: Payload) => void,
	) {
		const unlock = await this.mutex.lock();
		try {
			const id = await this.subscribe_(
				subscription.type,
				subscription.version,
				condition,
			);
			this.notify.set(id, callback as (event: unknown) => void);
			this.resub.push({
				type: subscription.type,
				version: subscription.version,
				condition,
				id,
			});
		} finally {
			unlock();
		}
	}

	private async resubscribe() {
		for (const { type, version, condition, id } of this.resub) {
			const callback = this.notify.get(id)!;
			const newId = await this.subscribe_(type, version, condition as object);
			this.notify.delete(id);
			this.notify.set(newId, callback);
		}
	}
}

type EventSubConnection = {
	ws: WebSocket;
	sessionId: string;
};
