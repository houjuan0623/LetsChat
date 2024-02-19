import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { placeholders } from '../../../utils/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import * as Mailer from '../../../mailer';

export const sendMail = function(from, subject, body, dryrun, query) {
	Mailer.checkAddressFormatAndThrow(from, 'Mailer.sendMail');
	if (body.indexOf('[unsubscribe]') === -1) {
		throw new Meteor.Error('error-missing-unsubscribe-link', 'You must provide the [unsubscribe] link.', {
			function: 'Mailer.sendMail',
		});
	}

	let userQuery = { 'mailer.unsubscribed': { $exists: 0 } };
	if (query) {
		userQuery = { $and: [userQuery, EJSON.parse(query)] };
	}

	if (dryrun) {
		return Meteor.users.find({
			'emails.address': from,
		}).forEach((user) => {
			const email = `${ user.name } <${ user.emails[0].address }>`;
			const html = placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
					_id: user._id,
					createdAt: user.createdAt.getTime(),
				})),
				name: user.name,
				email,
			});

			SystemLogger.debug(`Sending email to ${ email }`);
			return Mailer.send({
				to: email,
				from,
				subject,
				html,
			});
		});
	}
	return Meteor.users.find(userQuery).forEach(function(user) {
		if (user && user.emails && Array.isArray(user.emails) && user.emails.length) {
			const email = `${ user.name } <${ user.emails[0].address }>`;

			const html = placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
					_id: user._id,
					createdAt: user.createdAt.getTime(),
				})),
				name: escapeHTML(user.name),
				email: escapeHTML(email),
			});
			SystemLogger.debug(`Sending email to ${ email }`);
			return Mailer.send({
				to: email,
				from,
				subject,
				html,
			});
		}
	});
};
