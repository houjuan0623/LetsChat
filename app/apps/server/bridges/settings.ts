import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { ServerSettingBridge } from '@rocket.chat/apps-engine/server/bridges/ServerSettingBridge';

import { Settings } from '../../../models/server';
import { AppServerOrchestrator } from '../orchestrator';

export class AppSettingBridge extends ServerSettingBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getAll(appId: string): Promise<Array<ISetting>> {
		this.orch.debugLog(`The App ${ appId } is getting all the settings.`);

		return Settings.find({ secret: false })
			.fetch()
			.map((s: ISetting) => this.orch.getConverters()?.get('settings').convertToApp(s));
	}

	protected async getOneById(id: string, appId: string): Promise<ISetting> {
		this.orch.debugLog(`The App ${ appId } is getting the setting by id ${ id }.`);

		if (!await this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		return this.orch.getConverters()?.get('settings').convertById(id);
	}

	protected async hideGroup(name: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is hidding the group ${ name }.`);

		throw new Error('Method not implemented.');
	}

	protected async hideSetting(id: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is hidding the setting ${ id }.`);

		if (!await this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}

	protected async isReadableById(id: string, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${ appId } is checking if they can read the setting ${ id }.`);

		return !Settings.findOneById(id).secret;
	}

	protected async updateOne(setting: ISetting & { id: string }, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is updating the setting ${ setting.id } .`);

		if (!await this.isReadableById(setting.id, appId)) {
			throw new Error(`The setting "${ setting.id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}
}
