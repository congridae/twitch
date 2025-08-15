import type { Endpoint } from "./helix.ts";

//#region Get Users
export type GetUsersQuery = {
	id?: string[];
	login?: string[];
};

export type GetUsersResponse = {
	data: {
		id: string;
		login: string;
		display_name: string;
		type: "admin" | "global_mod" | "staff" | "";
		broadcaster_type: "affiliate" | "partner" | "";
		description: string;
		profile_image_url: string;
		offline_image_url: string;
		email: string;
		created_at: string;
	}[];
};

export const GetUsers: Endpoint<
	GetUsersQuery,
	undefined,
	GetUsersResponse
> = { method: "GET", path: "users" };

//#region Send Chat Message
export type SendChatMessageBody = {
	broadcaster_id: string;
	sender_id: string;
	message: string;
	reply_parent_message_id?: string;
	for_source_only?: boolean;
};

export type SendChatMessageResponse = {
	data: {
		message_id: string;
		is_sent: boolean;
		drop_reason: {
			code: string;
			message: string;
		};
	}[];
};

export const SendChatMessage: Endpoint<
	undefined,
	SendChatMessageBody,
	SendChatMessageResponse
> = {
	method: "POST",
	path: "chat/messages",
};

//#region Create EventSub Subscription
export type CreateEventSubSubscriptionBody = {
	type: string;
	version: string;
	condition: object;
	transport: {
		method: "websocket";
		session_id: string;
	} | {
		method: "conduit";
		conduit_id: string;
	} | {
		method: "webhook";
		callback: string;
		secret: string;
	} | {
		method: string;
		[key: string]: string;
	};
};

export type CreateEventSubSubscriptionResponse = {
	data: {
		id: string;
		status: string;
		type: string;
		version: string;
		condition: object;
		created_at: string;
		transport: {
			method: "websocket";
			session_id: string;
			connected_at: string;
		} | {
			method: "conduit";
			conduit_id: string;
		} | {
			method: "webhook";
			callback: string;
		} | {
			method: string;
			[key: string]: string;
		};
		cost: number;
	}[];
	total: number;
	total_cost: number;
	max_total_cost: number;
};

export const CreateEventSubSubscription: Endpoint<
	undefined,
	CreateEventSubSubscriptionBody,
	CreateEventSubSubscriptionResponse
> = {
	method: "POST",
	path: "eventsub/subscriptions",
};

//#region Delete EventSub Subscription
export type DeleteEventSubSubscriptionQuery = {
	id: string;
};

export const DeleteEventSubSubscription: Endpoint<
	DeleteEventSubSubscriptionQuery,
	undefined,
	undefined
> = {
	method: "DELETE",
	path: "eventsub/subscriptions",
};

//#region Get EventSub Subscriptions
export type GetEventSubSubscriptionsStatus =
	| "enabled"
	| "webhook_callback_verification_pending"
	| "webhook_callback_verification_failed"
	| "notification_failures_exceeded"
	| "authorization_revoked"
	| "moderator_removed"
	| "user_removed"
	| "chat_user_banned"
	| "version_removed"
	| "beta_maintenance"
	| "websocket_disconnected"
	| "websocket_failed_ping_pong"
	| "websocket_received_inbound_traffic"
	| "websocket_connection_unused"
	| "websocket_internal_error"
	| "websocket_network_timeout"
	| "websocket_network_error"
	| "websocket_failed_to_reconnect"
	| string;

export type GetEventSubSubscriptionsQuery = {
	status?: GetEventSubSubscriptionsStatus;
	type?: string;
	user_id?: string;
	subscription_id?: string;
	after?: string;
};

export type GetEventSubSubscriptionsResponse = {
	data: {
		id: string;
		status: GetEventSubSubscriptionsStatus;
		type: string;
		version: string;
		condition: object;
		created_at: string;
		transport: {
			method: "websocket";
			session_id: string;
			connected_at: string;
			disconnected_at: string;
		} | {
			method: "conduit";
		} | {
			method: "webhook";
			callback: string;
		} | {
			method: string;
			[key: string]: string;
		};
		cost: number;
	}[];
	total: number;
	total_cost: number;
	max_total_cost: number;
	pagination: {
		cursor: string;
	};
};

export const GetEventSubSubscriptions: Endpoint<
	GetEventSubSubscriptionsQuery,
	undefined,
	GetEventSubSubscriptionsResponse
> = {
	method: "GET",
	path: "eventsub/subscriptions",
};

//#region Ban User
export type BanUserQuery = {
	broadcaster_id: string;
	moderator_id: string;
};

export type BanUserBody = {
	data: {
		user_id: string;
		duration?: number;
		reason?: string;
	};
};

export type BanUserResponse = {
	data: {
		broadcaster_id: string;
		moderator_id: string;
		user_id: string;
		created_at: string;
		end_time: string;
	}[];
};

export const BanUser: Endpoint<BanUserQuery, BanUserBody, BanUserResponse> = {
	method: "POST",
	path: "moderation/bans",
};

//#region Unban User
export type UnbanUserQuery = {
	broadcaster_id: string;
	moderator_id: string;
	user_id: string;
};

export const UnbanUser: Endpoint<UnbanUserQuery, undefined, undefined> = {
	method: "DELETE",
	path: "moderation/bans",
};

//#region Add Channel Moderator
export type AddChannelModeratorQuery = {
	broadcaster_id: string;
	user_id: string;
};

export const AddChannelModerator: Endpoint<
	AddChannelModeratorQuery,
	undefined,
	undefined
> = {
	method: "POST",
	path: "moderation/moderators",
};

//#region Remove Channel Moderator
export type RemoveChannelModeratorQuery = {
	broadcaster_id: string;
	user_id: string;
};

export const RemoveChannelModerator: Endpoint<
	RemoveChannelModeratorQuery,
	undefined,
	undefined
> = {
	method: "DELETE",
	path: "moderation/moderators",
};

//#region Start Commercial
export type StartCommercialBody = {
	broadcaster_id: string;
	length: number;
};

export type StartCommercialResponse = {
	data: {
		length: number;
		message: string;
		retry_after: number;
	}[];
};

//#region Create Custom Rewards
type CustomRewardResponse = {
	data: {
		broadcaster_id: string;
		broadcaster_login: string;
		broadcaster_name: string;
		id: string;
		title: string;
		prompt: string;
		cost: number;
		image: {
			url_1x: string;
			url_2x: string;
			url_4x: string;
		};
		default_image: {
			url_1x: string;
			url_2x: string;
			url_4x: string;
		};
		background_color: string;
		is_enalbed: boolean;
		is_user_input_required: boolean;
		max_per_stream_setting: {
			is_enabled: boolean;
			max_per_stream: number;
		};
		max_per_user_per_stream_setting: {
			is_enabled: boolean;
			max_per_user_per_stream: number;
		};
		global_cooldown_setting: {
			is_enabled: boolean;
			global_cooldown_seconds: number;
		};
		is_paused: boolean;
		is_in_stock: boolean;
		should_redemptions_skip_request_queue: boolean;
		redemptions_redeemed_current_stream: number | null;
		cooldown_expires_at: string | null;
	}[];
};

export type CreateCustomRewardsQuery = {
	broadcaster_id: string;
};

export type CreateCustomRewardsBody = {
	title: string;
	cost: number;
	prompt?: string;
	is_enabled?: boolean;
	background_color?: string;
	is_user_input_required?: boolean;
	is_max_per_stream_enabled?: true;
	max_per_stream?: number;
	is_max_per_user_per_stream_enabled?: boolean;
	max_per_user_per_stream?: number;
	is_global_cooldown_enabled?: boolean;
	global_cooldown_seconds?: number;
	should_redemptions_skip_request_queue?: boolean;
};

export type CreateCustomRewardsRespones = CustomRewardResponse;

export const CreateCustomRewards: Endpoint<
	CreateCustomRewardsQuery,
	CreateCustomRewardsBody,
	CreateCustomRewardsRespones
> = {
	method: "POST",
	path: "channel_points/custom_rewards",
};

//#region Get Custom Reward
export type GetCustomRewardQuery = {
	broadcaster_id: string;
	id?: string;
	only_managable_rewards?: boolean;
};

export type GetCustomRewardResponse = CustomRewardResponse;

export const GetCustomReward: Endpoint<
	GetCustomRewardQuery,
	undefined,
	GetCustomRewardResponse
> = {
	method: "GET",
	path: "channel_points/custom_rewards",
};

//#region Get Custom Reward Redemption
export type GetCustomRewardRedemptionQuery =
	& {
		broadcaster_id: string;
		reward_id: string;
		sort?: "OLDEST" | "NEWEST";
		after?: string;
		first?: number;
	}
	& (
		{
			status?: "CANCELED" | "FULFILLED" | "UNFULFILLED";
			id: string;
		} | {
			status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
			id?: string;
		}
	);

export type GetCustomRewardRedemptionResponse = {
	data: {
		broadcaster_id: string;
		broadcaster_login: string;
		broadcaster_name: string;
		id: string;
		user_login: string;
		user_id: string;
		user_name: string;
		user_input: string;
		status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
		redeemed_at: string;
		reward: {
			id: string;
			title: string;
			prompt: string;
			cost: number;
		};
	}[];
};

export const GetCustomRewardRedemption: Endpoint<
	GetCustomRewardRedemptionQuery,
	undefined,
	GetCustomRewardRedemptionResponse
> = {
	method: "GET",
	path: "channel_points/custom_rewards/redemptions",
};

//#region Update Redemption Status
export type UpdateRedemptionStatusQuery = {
	id: string;
	broadcaster_id: string;
	reward_id: string;
};

export type UpdateRedemptionStatusBody = {
	status: "CANCELED" | "FULFILLED";
};

export type UpdateRedemptionStatusResponse = {
	data: {
		broadcaster_id: string;
		broadcaster_login: string;
		broadcaster_name: string;
		id: string;
		user_id: string;
		user_name: string;
		user_login: string;
		reward: {
			id: string;
			title: string;
			prompt: string;
			cost: number;
		};
		user_input: string;
		status: "CANCELED" | "FULFILLED" | "UNFULFILLED";
		redeemed_at: string;
	}[];
};

export const UpdateRedemptionStatus: Endpoint<
	UpdateRedemptionStatusQuery,
	UpdateRedemptionStatusBody,
	UpdateRedemptionStatusResponse
> = {
	method: "PATCH",
	path: "channel_points/custom_rewards/redemptions",
};

//#region Get Predictions
type PredictionInfo = {
	data: (
		& {
			id: string;
			broadcaster_id: string;
			broadcaster_name: string;
			broadcaster_login: string;
			title: string;
			outcomes: {
				id: string;
				title: string;
				users: number;
				channel_points: number;
				top_predictors: {
					user_id: string;
					user_name: string;
					user_login: string;
					channel_points_used: number;
					channel_points_won: number;
				}[] | null;
				color: "BLUE" | "PINK" | string;
			}[];
			prediction_window: number;
			created_at: string;
			ended_at: string;
			locked_at: string;
		}
		& ({ status: "RESOLVED"; winning_outcome_id: string } | {
			status: "ACTIVE" | "CANCELED" | "LOCKED";
			winning_outcome_id: null;
		})
	)[];
};

export type GetPredictionsQuery = {
	broadcaster_id: string;
	id?: string | string[];
	first?: number;
	after?: string;
};

export type GetPredictionsResponse = PredictionInfo;

export const GetPredictions: Endpoint<
	GetPredictionsQuery,
	undefined,
	GetPredictionsResponse
> = {
	method: "GET",
	path: "predictions",
};

//#region Create Prediction
export type CreatePredictionBody = {
	broadcaster_id: string;
	title: string;
	outcomes: {
		title: string;
	}[];
	prediction_window: number;
};

export type CreatePredictionResponse = PredictionInfo;

export const CreatePrediction: Endpoint<
	undefined,
	CreatePredictionBody,
	CreatePredictionResponse
> = {
	method: "POST",
	path: "predictions",
};

//#region End Prediction
export type EndPredictionBody =
	& {
		broadcaster_id: string;
		id: string;
	}
	& ({
		status: "RESOLVED";
		winning_outcome_id: string;
	} | {
		status: "CANCELED" | "LOCKED";
	});

export type EndPredictionResponse = PredictionInfo;

export const EndPrediction: Endpoint<
	undefined,
	EndPredictionBody,
	EndPredictionResponse
> = {
	method: "PATCH",
	path: "predictions",
};

//#region Get Blocked Term
export type GetBlockedTermsQuery = {
	broadcaster_id: string;
	moderator_id: string;
	first?: number;
	after?: string;
};

export type GetBlockedTermsResponse = {
	data: {
		broadcaster_id: string;
		moderator_id: string;
		id: string;
		text: string;
		created_at: string;
		updated_at: string;
		expires_at: string;
	}[];
	pagination: {
		cursor: string;
	};
};

export const GetBlockedTerms: Endpoint<
	GetBlockedTermsQuery,
	undefined,
	GetBlockedTermsResponse
> = {
	method: "GET",
	path: "moderation/blocked_terms",
};

//#region Add Blocked Terms
export type AddBlockedTermsQuery = {
	broadcaster_id: string;
	moderator_id: string;
};

export type AddBlockedTermsBody = {
	text: string;
};

export type AddBlockedTermsResponse = {
	data: {
		broadcaster_id: string;
		moderator_id: string;
		id: string;
		text: string;
		created_at: string;
		updated_at: string;
		expires_at: string;
	}[];
};

export const AddBlockedTerms: Endpoint<
	AddBlockedTermsQuery,
	AddBlockedTermsBody,
	AddBlockedTermsResponse
> = {
	method: "POST",
	path: "moderation/blocked_terms",
};

//#region Remove Blocked Term
export type RemoveBlockedTermQuery = {
	broadcaster_id: string;
	moderator_id: string;
	id: string;
};

export const RemoveBlockedTerm: Endpoint<
	RemoveBlockedTermQuery,
	undefined,
	undefined
> = {
	method: "DELETE",
	path: "moderation/blocked_terms",
};

//#region Send Chat Announcement
export type SendChatAnnouncementQuery = {
	broadcaster_id: string;
	moderator_id: string;
};

export type SendChatAnnouncementBody = {
	message: string;
	color?: "blue" | "green" | "orange" | "purple" | "primary";
};

export const SendChatAnnouncement: Endpoint<
	SendChatAnnouncementQuery,
	SendChatAnnouncementBody,
	undefined
> = {
	method: "POST",
	path: "chat/announcements",
};
