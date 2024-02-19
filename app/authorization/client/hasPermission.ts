import { Meteor } from 'meteor/meteor';

import { ChatPermissions } from './lib/ChatPermissions';
import * as Models from '../../models/client';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';
import { IUser } from '../../../definition/IUser';
import { IRole } from '../../../definition/IRole';
import { IPermission } from '../../../definition/IPermission';

const isValidScope = (scope: IRole['scope']): scope is keyof typeof Models =>
	typeof scope === 'string' && scope in Models;

const createPermissionValidator = (quantifier: (predicate: (permissionId: IPermission['_id']) => boolean) => boolean) =>
	(permissionIds: IPermission['_id'][], scope: IRole['scope'], userId: IUser['_id']): boolean => {
		const user: IUser | null = Models.Users.findOneById(userId, { fields: { roles: 1 } });

		const checkEachPermission = quantifier.bind(permissionIds);

		return checkEachPermission((permissionId) => {
			if (user?.roles) {
				if (AuthorizationUtils.isPermissionRestrictedForRoleList(permissionId, user.roles)) {
					return false;
				}
			}

			const permission: IPermission | null = ChatPermissions.findOne(permissionId, { fields: { roles: 1 } });
			const roles = permission?.roles ?? [];

			return roles.some((roleName) => {
				const role = Models.Roles.findOne(roleName, { fields: { scope: 1 } });
				const roleScope = role?.scope;

				if (!isValidScope(roleScope)) {
					return false;
				}

				const model = Models[roleScope];
				return model.isUserInRole && model.isUserInRole(userId, roleName, scope);
			});
		});
	};

const atLeastOne = createPermissionValidator(Array.prototype.some);

const all = createPermissionValidator(Array.prototype.every);

const validatePermissions = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope: IRole['scope'],
	predicate: (permissionIds: IPermission['_id'][], scope: IRole['scope'], userId: IUser['_id']) => boolean,
	userId?: IUser['_id'] | null,
): boolean => {
	userId = userId ?? Meteor.userId();

	if (!userId) {
		return false;
	}

	if (!Models.AuthzCachedCollection.ready.get()) {
		return false;
	}

	return predicate(([] as IPermission['_id'][]).concat(permissions), scope, userId);
};

export const hasAllPermission = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: IRole['scope'],
): boolean => validatePermissions(permissions, scope, all);

export const hasAtLeastOnePermission = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: IRole['scope'],
): boolean => validatePermissions(permissions, scope, atLeastOne);

export const userHasAllPermission = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: IRole['scope'],
	userId?: IUser['_id'] | null,
): boolean => validatePermissions(permissions, scope, all, userId);

export const hasPermission = hasAllPermission;
