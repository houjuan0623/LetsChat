import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Utils2fa } from './lib/2fa';
import '../../../client/startup/ldap';

Meteor.loginWithLDAPAndTOTP = function(...args) {
	// Pull username and password
	const username = args.shift();
	const ldapPass = args.shift();

	// Check if last argument is a function. if it is, pop it off and set callback to it
	const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
	// The last argument before the callback is the totp code
	const code = args.pop();

	// if args still holds options item, grab it
	const ldapOptions = args.length > 0 ? args.shift() : {};

	// Set up loginRequest object
	const loginRequest = {
		ldap: true,
		username,
		ldapPass,
		ldapOptions,
	};

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: loginRequest,
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

const { loginWithLDAP } = Meteor;

Meteor.loginWithLDAP = function(...args) {
	const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;

	Utils2fa.overrideLoginMethod(loginWithLDAP, args, callback, Meteor.loginWithLDAPAndTOTP, args[0]);
};
