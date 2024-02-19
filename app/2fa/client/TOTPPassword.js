import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';

import { Utils2fa } from './lib/2fa';
import { t } from '../../utils';
import { process2faReturn } from './callWithTwoFactorRequired';

Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = { username: selector };
		} else {
			selector = { email: selector };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					user: selector,
					password: Accounts._hashPassword(password),
				},
				code,
			},
		}],
		userCallback(error) {
			if (error) {
				Utils2fa.reportError(error, callback);
			} else {
				callback && callback();
			}
		},
	});
};

const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = function(email, password, cb) {
	loginWithPassword(email, password, (error) => {
		process2faReturn({
			error,
			originalCallback: cb,
			emailOrUsername: email,
			onCode: (code) => {
				Meteor.loginWithPasswordAndTOTP(email, password, code, (error) => {
					if (error && error.error === 'totp-invalid') {
						toastr.error(t('Invalid_two_factor_code'));
						cb();
					} else {
						cb(error);
					}
				});
			},
		});
	});
};
