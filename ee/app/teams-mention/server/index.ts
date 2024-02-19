import { Promise } from 'meteor/promise';

import { onLicense } from '../../license/server';
import { overwriteClassOnLicense } from '../../license/server/license';
import { SpotlightEnterprise } from './EESpotlight';
import { Spotlight } from '../../../../server/lib/spotlight';
import { MentionQueries } from '../../../../app/mentions/server/server';
import { callbacks } from '../../../../app/callbacks/server';
import { MentionQueriesEnterprise } from './EEMentionQueries';
import { Team } from '../../../../server/sdk';
import { ITeamMember } from '../../../../definition/ITeam';
import { IMessage } from '../../../../definition/IMessage';

interface IExtraDataForNotification {
	userMentions: any[];
	otherMentions: any[];
	message: IMessage;
}

onLicense('teams-mention', () => {
	// Override spotlight with EE version
	overwriteClassOnLicense('teams-mention', Spotlight, SpotlightEnterprise);
	overwriteClassOnLicense('teams-mention', MentionQueries, MentionQueriesEnterprise);

	callbacks.add('beforeGetMentions', (mentionIds: Array<string>, extra: IExtraDataForNotification) => {
		const { otherMentions } = extra;

		const teamIds = otherMentions
			.filter(({ type }) => type === 'team')
			.map(({ _id }) => _id);

		if (!teamIds.length) {
			return mentionIds;
		}

		const members: ITeamMember[] = Promise.await(Team.getMembersByTeamIds(teamIds, { projection: { userId: 1 } }));
		mentionIds.push(...new Set(
			members
				.map(({ userId }: { userId: string }) => userId)
				.filter((userId: string) => !mentionIds.includes(userId)),
		));

		return mentionIds;
	});
});
