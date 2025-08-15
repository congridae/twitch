export class TwitchError extends Error {}

export interface TwitchLogger {
	debug: (message: string) => void;
	info: (message: string) => void;
	warning: (message: string) => void;
	error: (message: string) => void;
}

export function makeDefaultLogger(): TwitchLogger {
	return {
		debug: (message) => console.debug(message),
		info: (message) => console.log(message),
		warning: (message) => console.warn(message),
		error: (message) => console.error(message),
	};
}

export class Mutex {
	locked: boolean;
	queue: (() => void)[];

	constructor() {
		this.locked = false;
		this.queue = [];
	}

	async lock(): Promise<() => void> {
		if (!this.locked) {
			this.locked = true;
			return this.unlock.bind(this);
		}

		await new Promise((resolve) => this.queue.push(resolve as () => void));
		this.locked = true;
		return this.unlock.bind(this);
	}

	unlock() {
		const next = this.queue.shift();
		if (next === undefined) {
			this.locked = false;
			return;
		}
		next();
	}

	async with(func: () => Promise<void>): Promise<void> {
		const unlock = await this.lock();
		try {
			await func();
		} finally {
			unlock();
		}
	}
}
