import { InternalBridge } from '@rocket.chat/apps-engine/server/bridges/InternalBridge';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppServerOrchestrator } from '../orchestrator';
import { Subscriptions, Settings } from '../../../models/server';
import { ISubscription } from '../../../../definition/ISubscription';

export class AppInternalBridge extends InternalBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected getUsernamesOfRoomById(roomId: string): Array<string> {
		if (!roomId) {
			return [];
		}

		const records = Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
			fields: {
				'u.username': 1,
			},
		}).fetch();

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s: ISubscription) => s.u.username);
	}

	protected async getWorkspacePublicKey(): Promise<ISetting> {
		const publicKeySetting = Settings.findById('Cloud_Workspace_PublicKey').fetch()[0];

		return this.orch.getConverters()?.get('settings').convertToApp(publicKeySetting);
	}
}
