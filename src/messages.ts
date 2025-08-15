export type MessageType =
	| "session_welcome"
	| "notification"
	| "session_reconnect"
	| "revocation"
	| "session_keepalive";

export type Message =
	| WelcomeMessage
	| NotificationMessage
	| ReconnectMessage
	| RevocationMessage
	| KeepaliveMessage;

export type GenericMessage<Payload, Type> = {
	metadata: MessageMetadata<Type>;
	payload: Payload;
};

export type MessageMetadata<Type> = {
	message_id: Type;
	message_type: string;
	message_timestamp: string;
};

export type WelcomePayload = {
	session: {
		id: string;
		status: "connected";
		connected_at: string;
		keepalive_timeout_seconds: string;
		reconnect_url: null; // thanks twith
	};
};

export type WelcomeMessage = GenericMessage<WelcomePayload, "session_welcome">;

export type NotificationPayload = {
	subscription: {
		id: string;
		status: "enabled";
		type: string;
		version: string;
		cost: number;
		condition: object;
		transport: {
			method: "websocket";
			session_id: string;
		};
		created_at: string;
	};
	event: unknown;
};

export type NotificationMessage = GenericMessage<
	NotificationPayload,
	"notification"
>;

export type ReconnectPayload = {
	session: {
		id: string;
		status: "reconnecting";
		keepalive_timeout_seconds: null; // uh-huh
		reconnect_url: string;
		created_at: string;
	};
};

export type ReconnectMessage = GenericMessage<
	ReconnectPayload,
	"session_reconnect"
>;

export type RevocationPayload = {
	subscription: {
		id: string;
		status: "authorized_revoked" | "user_removed" | "version_removed" | string;
		type: string;
		version: string;
		cost: number;
		condition: object;
		transport: {
			method: "websocket";
			session_id: string;
		};
		created_at: string;
	};
};

export type RevocationMessage = GenericMessage<RevocationPayload, "revocation">;

export type KeepaliveMessage = GenericMessage<
	Record<never, never>,
	"session_keepalive"
>;
