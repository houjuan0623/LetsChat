import { HTTP } from 'meteor/http';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { settings } from '../../../settings';
import { Settings } from '../../../models';
import { callbacks } from '../../../callbacks';
import { LICENSE_VERSION } from '../license';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function getWorkspaceLicense() {
	const token = getWorkspaceAccessToken();

	if (!token) {
		return { updated: false, license: '' };
	}

	let licenseResult;
	try {
		licenseResult = HTTP.get(`${ settings.get('Cloud_Workspace_Registration_Client_Uri') }/license?version=${ LICENSE_VERSION }`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			SystemLogger.error(`Failed to update license from Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);
		} else {
			SystemLogger.error(e);
		}

		return { updated: false, license: '' };
	}

	const remoteLicense = licenseResult.data;
	const currentLicense = settings.get('Cloud_Workspace_License');

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return { updated: false, license: '' };
	}

	Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	callbacks.run('workspaceLicenseChanged', remoteLicense.license);

	return { updated: true, license: remoteLicense.license };
}
