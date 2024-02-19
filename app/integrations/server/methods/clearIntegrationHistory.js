import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { IntegrationHistory, Integrations } from '../../../models';
import notifications from '../../../notifications/server/lib/Notifications';

Meteor.methods({
	clearIntegrationHistory(integrationId) {
		let integration;

		if (hasPermission(this.userId, 'manage-outgoing-integrations') || hasPermission(this.userId, 'manage-outgoing-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-outgoing-integrations') || hasPermission(this.userId, 'manage-own-outgoing-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId } });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'clearIntegrationHistory' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'clearIntegrationHistory' });
		}

		IntegrationHistory.removeByIntegrationId(integrationId);

		notifications.streamIntegrationHistory.emit(integrationId, { type: 'removed' });

		return true;
	},
});
