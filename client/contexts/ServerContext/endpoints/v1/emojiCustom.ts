import type { ICustomEmojiDescriptor } from '../../../../../definition/ICustomEmojiDescriptor';

export type EmojiCustomEndpoints = {
	'emoji-custom.list': {
		GET: (params: { query: string }) => {
			emojis?: {
				update: ICustomEmojiDescriptor[];
			};
		};
	};
	'emoji-custom.delete': {
		POST: (params: { emojiId: ICustomEmojiDescriptor['_id'] }) => void;
	};
};
