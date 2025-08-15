import { Mutex, TwitchError } from "./utils.ts";

export abstract class TwitchAuth {
	id: string;
	secret: string;
	token: string;
	expiration: number;

	constructor(id: string, secret: string, token: string, expiresAt: number) {
		this.id = id;
		this.secret = secret;
		this.token = token;
		this.expiration = expiresAt;
	}

	async authorize(headers: Record<string, string>): Promise<void> {
		await this.autoRefresh();
		headers.authorization = `Bearer ${this.token}`;
		headers["client-id"] = this.id;
	}

	expired(): boolean {
		return this.expiration > Date.now();
	}

	async autoRefresh(grace: number = 60): Promise<void> {
		if (this.expiration - Date.now() < grace) {
			await this.refresh();
		}
	}

	abstract refresh(): Promise<void>;

	abstract marshal(): object;
}

export class TwitchAppAuth extends TwitchAuth {
	constructor({ id, secret, token, expiration }: TwitchAppAuthMarshal) {
		super(id, secret, token, expiration);
	}

	override async refresh(): Promise<void> {
		const { token, expiresIn } = await appAuth(
			this.id,
			this.secret,
		);
		this.token = token;
		this.expiration = Date.now() + expiresIn * 1000;
	}

	override marshal(): TwitchAppAuthMarshal {
		return {
			id: this.id,
			secret: this.secret,
			token: this.token,
			expiration: this.expiration,
		};
	}

	static async make(
		id: string,
		secret: string,
	): Promise<TwitchAppAuth> {
		const { token, expiresIn } = await appAuth(id, secret);
		return new TwitchAppAuth({
			id,
			secret,
			token,
			expiration: Date.now() + expiresIn * 1000,
		});
	}
}

export type TwitchAppAuthMarshal = {
	id: string;
	secret: string;
	token: string;
	expiration: number;
};

async function appAuth(
	id: string,
	secret: string,
): Promise<{
	token: string;
	expiresIn: number;
}> {
	const response = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: id,
			client_secret: secret,
			grant_type: "client_credentials",
		}).toString(),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	await checkError(response);
	const { access_token, expires_in } = await response.json() as {
		access_token: string;
		expires_in: number;
	};
	return {
		token: access_token,
		expiresIn: expires_in,
	};
}

export class TwitchUserAuth extends TwitchAuth {
	refreshToken: string;
	scopes: string[];
	refreshLock: Mutex;

	constructor(
		{ id, secret, token, refresh, expiration, scopes }: TwitchUserAuthMarshal,
	) {
		super(id, secret, token, expiration);
		this.refreshToken = refresh;
		this.scopes = scopes;
		this.refreshLock = new Mutex();
	}

	override async refresh(): Promise<void> {
		const { token, expiresIn, refresh } = await refreshRefreshToken(
			this.id,
			this.secret,
			this.refreshToken,
		);
		this.token = token;
		this.expiration = Date.now() + expiresIn * 1000;
		this.refreshToken = refresh;
	}

	override async autoRefresh(grace: number = 60): Promise<void> {
		if (this.expiration - Date.now() < grace) {
			const unlock = await this.refreshLock.lock();
			try {
				if (this.expiration - Date.now() < grace) {
					await this.refresh();
				}
			} finally {
				unlock();
			}
		}
	}

	override marshal(): TwitchUserAuthMarshal {
		return {
			id: this.id,
			secret: this.secret,
			token: this.token,
			refresh: this.refreshToken,
			expiration: this.expiration,
			scopes: this.scopes,
		};
	}

	static make(
		id: string,
		secret: string,
		redirectUri: string,
		scopes: string[],
	): { authUrl: string; callback: (url: string) => Promise<TwitchUserAuth> } {
		const state = getState();
		const authQuery = new URLSearchParams({
			response_type: "code",
			client_id: id,
			redirect_uri: redirectUri,
			scope: scopes.join(" "),
			state,
		}).toString();
		const authUrl = `https://id.twitch.tv/oauth2/authorize?${authQuery}`;
		return {
			authUrl,
			callback: async (url: string) => {
				const parsed = new URL(url);
				if (parsed.searchParams.get("error") !== null) {
					throw "user rejeceted";
				}
				const checkState = parsed.searchParams.get("state");
				if (checkState !== state) throw "state mismatch";
				const checkScope = parsed.searchParams.get("scope");
				if (checkScope === null) throw "scope missing";
				const checkScopes = checkScope === "" ? [] : checkScope.split(" ");
				if (!arrayCompare(scopes, checkScopes)) throw "scopes mismatch";
				const code = parsed.searchParams.get("code");
				if (!code) throw "code missing";

				const { token, expiresIn, refresh } = await exchangeToken(
					id,
					secret,
					code,
					redirectUri,
				);
				return new TwitchUserAuth({
					id,
					secret,
					token,
					refresh,
					expiration: Date.now() + expiresIn * 1000,
					scopes,
				});
			},
		};
	}

	static async interactive(
		id: string,
		secret: string,
		scopes: string[],
		port: number,
	): Promise<TwitchUserAuth> {
		const redirectUri = port === 80
			? "http://localhost"
			: `http://localhost:${port}`;
		const { authUrl, callback } = TwitchUserAuth.make(
			id,
			secret,
			redirectUri,
			scopes,
		);
		let url;
		const server = Deno.serve({
			port,
			onListen: async () => {
				const xdgOpenCmd = new Deno.Command("xdg-open", { args: [authUrl] });
				const xdgOpen = await xdgOpenCmd.output();
				if (xdgOpen.success) console.log("Continue authentication in browser");
				else console.log(`Open this url in your browser: ${authUrl}`);
			},
		}, (request) => {
			url = request.url;
			server.shutdown();
			return new Response("You can close this tab");
		});
		await server.finished;
		if (url === undefined) throw "no url";
		return await callback(url);
	}
}

export type TwitchUserAuthMarshal = {
	id: string;
	secret: string;
	token: string;
	refresh: string;
	expiration: number;
	scopes: string[];
};

const STATE_ALPHABET =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function getState(): string {
	let state = "";
	for (let i = 0; i < 16; i++) {
		state += STATE_ALPHABET[Math.floor(Math.random() * STATE_ALPHABET.length)];
	}
	return state;
}

async function exchangeToken(
	id: string,
	secret: string,
	code: string,
	redirectUri: string,
): Promise<{ token: string; expiresIn: number; refresh: string }> {
	const response = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: id,
			client_secret: secret,
			code,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}).toString(),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	await checkError(response);
	const { access_token, expires_in, refresh_token } = await response.json() as {
		access_token: string;
		expires_in: number;
		refresh_token: string;
	};
	return {
		token: access_token,
		expiresIn: expires_in,
		refresh: refresh_token,
	};
}

async function refreshRefreshToken(
	id: string,
	secret: string,
	refresh: string,
): Promise<{ token: string; expiresIn: number; refresh: string }> {
	const response = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: id,
			client_secret: secret,
			grant_type: "refresh_token",
			refresh_token: refresh,
		}).toString(),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	await checkError(response);
	const { access_token, expires_in, refresh_token } = await response.json() as {
		access_token: string;
		expires_in: number;
		refresh_token: string;
	};
	return {
		token: access_token,
		expiresIn: expires_in,
		refresh: refresh_token,
	};
}

async function checkError(response: Response) {
	if (response.status >= 400) {
		const json = await response.json() as {
			status: number;
			error?: string;
			message: string;
		};
		throw new TwitchError(
			`${json.status}${json.error ? ` ${json.error}` : ""}: ${json.message}`,
		);
	}
}

function arrayCompare<T>(lhs: T[], rhs: T[]): boolean {
	return lhs.length === rhs.length && lhs.every((v, i) => v === rhs[i]);
}
