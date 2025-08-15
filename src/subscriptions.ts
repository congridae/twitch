export type Subscription<Condition, Payload> = {
	type: string;
	version: string;
	scopes?: string[];
};

type ChatMessageBase = {
	broadcaster_user_id: string;
	broadcaster_user_name: string;
	broadcaster_user_login: string;
	chatter_user_id: string;
	chatter_user_name: string;
	chatter_user_login: string;
	message_id: string;
	message: {
		text: string;
		fragments: ({
			type: "text";
			text: string;
		} | {
			type: "cheermote";
			text: string;
			cheermote: {
				prefix: string;
				bits: number;
				tier: number;
			};
		} | {
			type: "emote";
			text: string;
			emote: {
				id: string;
				emote_set_id: string;
				owner_id: string;
				format: ("animated" | "static")[];
			};
		} | {
			type: "mention";
			text: string;
			mention: {
				user_id: string;
				user_name: string;
				user_login: string;
			};
		} | {
			type: string;
			text: string;
		})[];
	};
};

//#region channel.chat.message
export const ChannelChatMessageV1: Subscription<{
	broadcaster_user_id: string;
	user_id: string;
}, ChannelChatMessageV1Payload> = {
	type: "channel.chat.message",
	version: "1",
	scopes: ["user:read:chat"],
};

export type ChannelChatMessageV1Payload = ChatMessageBase & {
	message_type:
		| "text"
		| "channel_points_highlighted"
		| "channel_points_sub_only"
		| "user_intro"
		| "power_ups_message_effect"
		| "power_ups_gigantified_emote"
		| string;
	badges: {
		set_id: "Bits" | "Subscriber" | string;
		id: string;
		info: string;
	}[];
	cheer?: {
		bits: number;
	};
	color: string;
	reply?: {
		parent_message_id: string;
		parent_message_body: string;
		parent_user_id: string;
		parent_user_name: string;
		thread_message_id: string;
		thread_user_id: string;
		thread_user_name: string;
		thread_user_login: string;
	};
	channel_points_custom_reward_id?: string;
	source_broadcaster_user_id?: string;
	source_broadcaster_user_name?: string;
	source_broadcaster_user_login?: string;
	source_message_id?: string;
	source_badges?: {
		set_id: "Bits" | "Subscriber" | string;
		id: string;
		info: string;
	}[] | null;
	is_source_only?: boolean;
};

//#region channel.channel_points_custom_reward.redemption
export const ChannelChannelPointsCustomRewardRedemptionAddV1: Subscription<{
	broadcaster_user_id: string;
	reward_id?: string;
}, ChannelChannelPointsCustomRewardRedemptionAddV1Payload> = {
	type: "channel.channel_points_custom_reward_redemption.add",
	version: "1",
	scopes: ["channel:read:redemptions"],
};

export type ChannelChannelPointsCustomRewardRedemptionAddV1Payload = {
	id: string;
	broadcaster_user_id: string;
	broadcaster_user_login: string;
	broadcaster_user_name: string;
	user_id: string;
	user_login: string;
	user_name: string;
	user_input: string;
	status: "unknown" | "unfulfilled" | "fulfilled" | "cancelled" | string;
	reward: {
		id: string;
		title: string;
		cost: number;
		prompt: string;
	};
	redeemed_at: string;
};

//#region channel.subscribe
export const ChannelSubscribeV1: Subscription<{
	broadcaster_user_id: string;
}, {
	user_id: string;
	user_login: string;
	user_name: string;
	broadcaster_user_id: string;
	broadcaster_user_login: string;
	broadcaster_user_name: string;
	tier: "1000" | "2000" | "3000";
	is_gift: boolean;
}> = {
	type: "channel.subscribe",
	version: "1",
	scopes: ["channel:read:subscriptions"],
};

type ChannelPredictionBase = {
	id: string;
	broadcaster_user_id: string;
	broadcaster_user_login: string;
	broadcaster_user_name: string;
	title: string;
	outcomes: {
		id: string;
		title: string;
		color: string;
		users: number;
		channel_points: number;
		top_predictors: {
			user_id: string;
			user_login: string;
			user_name: string;
			channel_points_won: number | null;
			channel_points_used: number;
		}[];
	}[];
	started_at: string;
};

//#region channel.prediction.begin
export const ChannelPredictionBeginV1: Subscription<{
	broadcaster_user_id: string;
}, ChannelPredictionBase & { locks_at: string }> = {
	type: "channel.prediction.begin",
	version: "1",
	scopes: ["channel:read:predictions"],
};

//#region channel.prediction.progress
export const ChannelPredictionProgressV1: Subscription<{
	broadcaster_user_id: string;
}, ChannelPredictionBase & { locks_at: string }> = {
	type: "channel.prediction.progress",
	version: "1",
	scopes: ["channel:read:predictions"],
};

//#region channel.prediction.lock
export type ChannelPredictionLockV1Payload = ChannelPredictionBase & {
	locked_at: string;
};

export const ChannelPredictionLockV1: Subscription<{
	broadcaster_user_id: string;
}, ChannelPredictionLockV1Payload> = {
	type: "channel.prediction.lock",
	version: "1",
	scopes: ["channel:read:predictions"],
};

//#region channel.prediction.end
export const ChannelPredictionEndV1: Subscription<{
	broadcaster_user_id: string;
}, ChannelPredictionBase & { winning_outcome_id: string; ended_at: string }> = {
	type: "channel.prediction.end",
	version: "1",
	scopes: ["channel:read:predictions"],
};

//#region automod.message.hold
export const AutomodMessageHoldV2: Subscription<{
	broadcaster_user_id: string;
	moderator_user_id: string;
}, AutomodMessageHoldV2Payload> = {
	type: "automod.message.hold",
	version: "2",
	scopes: ["moderator:manage:automod"],
};

export type AutomodMessageHoldV2Payload =
	& ChatMessageBase
	& {
		held_at: string;
	}
	& ({
		reason: "automod";
		automod: {
			category: string;
			level: number;
			boundaries: {
				start_pos: number;
				end_pos: number;
			}[];
		};
	} | {
		reason: "blocked_term";
		blocked_terms: {
			terms_found: {
				term_id: string;
				boundary: {
					start_pos: string;
					end_pos: string;
				};
				owner_broadcaster_user_id: string;
				owner_broadcaster_user_login: string;
				owner_broadcaster_user_name: string;
			}[];
		};
	});
