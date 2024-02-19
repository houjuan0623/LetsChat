import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { businessHourManager } from '../../business-hour';
import { ILivechatBusinessHour } from '../../../../../definition/ILivechatBusinessHour';

export async function findLivechatBusinessHour(userId: string, id?: string, type?: string): Promise<Record<string, ILivechatBusinessHour>> {
	if (!await hasPermissionAsync(userId, 'view-livechat-business-hours')) {
		throw new Error('error-not-authorized');
	}

	return {
		businessHour: await businessHourManager.getBusinessHour(id, type) as ILivechatBusinessHour,
	};
}
