import { Accounts } from 'meteor/accounts-base';
import { Promise } from 'meteor/promise';

import { callbacks } from '../../app/callbacks/server';
import { LDAP } from '../sdk';
import { settings } from '../../app/settings/server';

// Register ldap login handler
Accounts.registerLoginHandler('ldap', function(loginRequest: Record<string, any>) {
	if (!loginRequest.ldap || !loginRequest.ldapOptions) {
		return undefined;
	}

	return Promise.await(LDAP.loginRequest(loginRequest.username, loginRequest.ldapPass));
});

// Prevent password logins by LDAP users when LDAP is enabled
let ldapEnabled: boolean;
settings.get('LDAP_Enable', (_key, value) => {
	if (ldapEnabled === value) {
		return;
	}
	ldapEnabled = value as boolean;

	if (!value) {
		return callbacks.remove('beforeValidateLogin', 'validateLdapLoginFallback');
	}

	callbacks.add('beforeValidateLogin', (login: Record<string, any>) => {
		if (!login.allowed) {
			return login;
		}

		// The fallback setting should only block password logins, so users that have other login services can continue using them
		if (login.type !== 'password') {
			return login;
		}

		// LDAP users can still login locally when login fallback is enabled
		if (login.user.services?.ldap?.id) {
			login.allowed = settings.get<boolean>('LDAP_Login_Fallback') ?? false;
		}

		return login;
	}, callbacks.priority.MEDIUM, 'validateLdapLoginFallback');
});
