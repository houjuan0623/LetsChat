import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings';
import { updatePredictedVisitorAbandonment, updateQueueInactivityTimeout } from './lib/Helper';
import { VisitorInactivityMonitor } from './lib/VisitorInactivityMonitor';
import { OmnichannelQueueInactivityMonitor } from './lib/QueueInactivityMonitor';
import './lib/query.helper';
import { MultipleBusinessHoursBehavior } from './business-hour/Multiple';
import { SingleBusinessHourBehavior } from '../../../../app/livechat/server/business-hour/Single';
import { businessHourManager } from '../../../../app/livechat/server/business-hour';
import { resetDefaultBusinessHourIfNeeded } from './business-hour/Helper';

const visitorActivityMonitor = new VisitorInactivityMonitor();
const businessHours = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new SingleBusinessHourBehavior(),
};

Meteor.startup(async function() {
	settings.onload('Livechat_abandoned_rooms_action', function(_, value) {
		updatePredictedVisitorAbandonment();
		if (!value || value === 'none') {
			return visitorActivityMonitor.stop();
		}
		visitorActivityMonitor.start();
	});
	settings.onload('Livechat_visitor_inactivity_timeout', function() {
		updatePredictedVisitorAbandonment();
	});
	settings.onload('Livechat_business_hour_type', (_, value) => {
		businessHourManager.registerBusinessHourBehavior(businessHours[value]);
		if (settings.get('Livechat_enable_business_hours')) {
			businessHourManager.startManager();
		}
	});
	settings.onload('Livechat_max_queue_wait_time_action', function(_, value) {
		updateQueueInactivityTimeout();
		if (!value || value === 'Nothing') {
			return Promise.await(OmnichannelQueueInactivityMonitor.stop());
		}
		return Promise.await(OmnichannelQueueInactivityMonitor.schedule());
	});

	settings.onload('Livechat_max_queue_wait_time', function(_, value) {
		if (value <= 0) {
			return Promise.await(OmnichannelQueueInactivityMonitor.stop());
		}
		updateQueueInactivityTimeout();
		Promise.await(OmnichannelQueueInactivityMonitor.schedule());
	});

	await resetDefaultBusinessHourIfNeeded();
});
