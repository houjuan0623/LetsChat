import { RoutingManager } from '../../../../../../app/livechat/server/lib/RoutingManager';
import { Users } from '../../../../../../app/models/server/raw';
import { IRoutingManagerConfig } from '../../../../../../definition/IRoutingManagerConfig';
import { IOmnichannelCustomAgent } from '../../../../../../definition/IOmnichannelCustomAgent';

/* Load Rotation Queuing method:
	* Routing method where the agent with the oldest routing time is the next agent to serve incoming chats
*/
class LoadRotation {
	private _config: IRoutingManagerConfig;

	constructor() {
		this._config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			showQueueLink: false,
			returnQueue: false,
			enableTriggerAction: true,
			autoAssignAgent: true,
		};
	}

	get config(): IRoutingManagerConfig {
		return this._config;
	}

	public async getNextAgent(department?: string, ignoreAgentId?: string): Promise<IOmnichannelCustomAgent | undefined> {
		const nextAgent = await Users.getLastAvailableAgentRouted(department, ignoreAgentId);
		if (!nextAgent) {
			return;
		}

		const { agentId, username } = nextAgent;
		return { agentId, username };
	}
}

RoutingManager.registerMethod('Load_Rotation', LoadRotation);
