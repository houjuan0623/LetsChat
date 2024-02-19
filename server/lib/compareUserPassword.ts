import { Accounts } from 'meteor/accounts-base';

import { IUser } from '../../definition/IUser';
import { IPassword } from '../../definition/IPassword';

/**
 * Check if a given password is the one user by given user or if the user doesn't have a password
 * @param {object} user User object
 * @param {object} pass Object with { plain: 'plain-test-password' } or { sha256: 'sha256password' }
 */
export function compareUserPassword(user: IUser, pass: IPassword): boolean {
	if (!user?.services?.password?.bcrypt?.trim()) {
		return false;
	}

	if (!pass || (!pass.plain && !pass.sha256)) {
		return false;
	}

	const password = pass.plain || {
		digest: pass.sha256?.toLowerCase() || '',
		algorithm: 'sha-256' as const,
	};

	const passCheck = Accounts._checkPassword(user, password);

	if (passCheck.error) {
		return false;
	}

	return true;
}
