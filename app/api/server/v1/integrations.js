import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasAtLeastOnePermission } from '../../../authorization/server';
import { IntegrationHistory, Integrations } from '../../../models';
import { API } from '../api';
import { mountIntegrationHistoryQueryBasedOnPermissions, mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { findOneIntegration } from '../lib/integrations';

API.v1.addRoute('integrations.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			type: String,
			name: String,
			enabled: Boolean,
			username: String,
			urls: Match.Maybe([String]),
			channel: String,
			event: Match.Maybe(String),
			triggerWords: Match.Maybe([String]),
			alias: Match.Maybe(String),
			avatar: Match.Maybe(String),
			emoji: Match.Maybe(String),
			token: Match.Maybe(String),
			scriptEnabled: Boolean,
			script: Match.Maybe(String),
			targetChannel: Match.Maybe(String),
		}));

		let integration;

		switch (this.bodyParams.type) {
			case 'webhook-outgoing':
				Meteor.runAsUser(this.userId, () => {
					integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
				});
				break;
			case 'webhook-incoming':
				Meteor.runAsUser(this.userId, () => {
					integration = Meteor.call('addIncomingIntegration', this.bodyParams);
				});
				break;
			default:
				return API.v1.failure('Invalid integration type.');
		}

		return API.v1.success({ integration });
	},
});

API.v1.addRoute('integrations.history', { authRequired: true }, {
	get() {
		if (!hasAtLeastOnePermission(this.userId, [
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
		])) {
			return API.v1.unauthorized();
		}

		if (!this.queryParams.id || this.queryParams.id.trim() === '') {
			return API.v1.failure('Invalid integration id.');
		}

		const { id } = this.queryParams;
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		const ourQuery = Object.assign(mountIntegrationHistoryQueryBasedOnPermissions(this.userId, id), query);

		const history = IntegrationHistory.find(ourQuery, {
			sort: sort || { _updatedAt: -1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			history,
			offset,
			items: history.length,
			total: IntegrationHistory.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('integrations.list', { authRequired: true }, {
	get() {
		if (!hasAtLeastOnePermission(this.userId, [
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		])) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign(mountIntegrationQueryBasedOnPermissions(this.userId), query);
		const integrations = Integrations.find(ourQuery, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			integrations,
			offset,
			items: integrations.length,
			total: Integrations.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('integrations.remove', { authRequired: true }, {
	post() {
		if (!hasAtLeastOnePermission(this.userId, [
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		])) {
			return API.v1.unauthorized();
		}

		check(this.bodyParams, Match.ObjectIncluding({
			type: String,
			target_url: Match.Maybe(String),
			integrationId: Match.Maybe(String),
		}));

		if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
			return API.v1.failure('An integrationId or target_url needs to be provided.');
		}

		let integration;
		switch (this.bodyParams.type) {
			case 'webhook-outgoing':
				if (this.bodyParams.target_url) {
					integration = Integrations.findOne({ urls: this.bodyParams.target_url });
				} else if (this.bodyParams.integrationId) {
					integration = Integrations.findOne({ _id: this.bodyParams.integrationId });
				}

				if (!integration) {
					return API.v1.failure('No integration found.');
				}

				Meteor.runAsUser(this.userId, () => {
					Meteor.call('deleteOutgoingIntegration', integration._id);
				});

				return API.v1.success({
					integration,
				});
			case 'webhook-incoming':
				integration = Integrations.findOne({ _id: this.bodyParams.integrationId });

				if (!integration) {
					return API.v1.failure('No integration found.');
				}

				Meteor.runAsUser(this.userId, () => {
					Meteor.call('deleteIncomingIntegration', integration._id);
				});

				return API.v1.success({
					integration,
				});
			default:
				return API.v1.failure('Invalid integration type.');
		}
	},
});

API.v1.addRoute('integrations.get', { authRequired: true }, {
	get() {
		const { integrationId, createdBy } = this.queryParams;
		if (!integrationId) {
			return API.v1.failure('The query parameter "integrationId" is required.');
		}

		return API.v1.success({
			integration: Promise.await(findOneIntegration({
				userId: this.userId,
				integrationId,
				createdBy,
			})),
		});
	},
});

API.v1.addRoute('integrations.update', { authRequired: true }, {
	put() {
		check(this.bodyParams, Match.ObjectIncluding({
			type: String,
			name: String,
			enabled: Boolean,
			username: String,
			urls: Match.Maybe([String]),
			channel: String,
			event: Match.Maybe(String),
			triggerWords: Match.Maybe([String]),
			alias: Match.Maybe(String),
			avatar: Match.Maybe(String),
			emoji: Match.Maybe(String),
			token: Match.Maybe(String),
			scriptEnabled: Boolean,
			script: Match.Maybe(String),
			targetChannel: Match.Maybe(String),
			integrationId: Match.Maybe(String),
			target_url: Match.Maybe(String),
		}));

		let integration;
		switch (this.bodyParams.type) {
			case 'webhook-outgoing':
				if (this.bodyParams.target_url) {
					integration = Integrations.findOne({ urls: this.bodyParams.target_url });
				} else if (this.bodyParams.integrationId) {
					integration = Integrations.findOne({ _id: this.bodyParams.integrationId });
				}

				if (!integration) {
					return API.v1.failure('No integration found.');
				}

				Meteor.call('updateOutgoingIntegration', integration._id, this.bodyParams);

				return API.v1.success({
					integration: Integrations.findOne({ _id: integration._id }),
				});
			case 'webhook-incoming':
				integration = Integrations.findOne({ _id: this.bodyParams.integrationId });

				if (!integration) {
					return API.v1.failure('No integration found.');
				}

				Meteor.call('updateIncomingIntegration', integration._id, this.bodyParams);

				return API.v1.success({
					integration: Integrations.findOne({ _id: integration._id }),
				});
			default:
				return API.v1.failure('Invalid integration type.');
		}
	},
});
