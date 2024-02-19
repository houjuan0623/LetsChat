import { Meteor } from 'meteor/meteor';
import { Emitter } from '@rocket.chat/emitter';

import { slashCommands, APIClient } from '../../../utils';
import { CachedCollectionManager } from '../../../ui-cached-collection';

export const AppEvents = Object.freeze({
	APP_ADDED: 'app/added',
	APP_REMOVED: 'app/removed',
	APP_UPDATED: 'app/updated',
	APP_STATUS_CHANGE: 'app/statusUpdate',
	APP_SETTING_UPDATED: 'app/settingUpdated',
	COMMAND_ADDED: 'command/added',
	COMMAND_DISABLED: 'command/disabled',
	COMMAND_UPDATED: 'command/updated',
	COMMAND_REMOVED: 'command/removed',
});

export class AppWebsocketReceiver extends Emitter {
	constructor() {
		super();

		this.streamer = new Meteor.Streamer('apps');

		CachedCollectionManager.onLogin(() => {
			this.listenStreamerEvents();
		});
	}

	listenStreamerEvents() {
		Object.values(AppEvents).forEach((eventName) => {
			this.streamer.on(eventName, this.emit.bind(this, eventName));
		});

		this.streamer.on(AppEvents.COMMAND_ADDED, this.onCommandAddedOrUpdated);
		this.streamer.on(AppEvents.COMMAND_UPDATED, this.onCommandAddedOrUpdated);
		this.streamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemovedOrDisabled);
		this.streamer.on(AppEvents.COMMAND_DISABLED, this.onCommandRemovedOrDisabled);
	}

	registerListener(event, listener) {
		this.on(event, listener);
	}

	unregisterListener(event, listener) {
		this.off(event, listener);
	}

	onCommandAddedOrUpdated = (command) => {
		APIClient.v1.get('commands.get', { command }).then((result) => {
			slashCommands.commands[command] = result.command;
		});
	}

	onCommandRemovedOrDisabled = (command) => {
		delete slashCommands.commands[command];
	}
}
