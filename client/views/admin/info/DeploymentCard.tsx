import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement } from 'react';

import { IInstance } from '../../../../definition/IInstance';
import { IServerInfo } from '../../../../definition/IServerInfo';
import { IStats } from '../../../../definition/IStats';
import Card from '../../../components/Card';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import InstancesModal from './InstancesModal';

type DeploymentCardProps = {
	info: IServerInfo;
	instances: Array<IInstance>;
	statistics: IStats;
};

const DeploymentCard = ({ info, statistics, instances }: DeploymentCardProps): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const setModal = useSetModal();

	const { commit = {} } = info;

	const appsEngineVersion = info && info.marketplaceApiVersion;

	const handleInstancesModal = useMutableCallback(() => {
		setModal(<InstancesModal instances={instances} onClose={(): void => setModal()} />);
	});

	return (
		<Card>
			<Card.Title>{t('Deployment')}</Card.Title>
			<Card.Body>
				<Card.Col>
					<Card.Col.Section>
						<Card.Col.Title>{t('Version')}</Card.Col.Title>
						{statistics.version}
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Deployment_ID')}</Card.Col.Title>
						{statistics.uniqueId}
					</Card.Col.Section>
					{appsEngineVersion && (
						<Card.Col.Section>
							<Card.Col.Title>{t('Apps_Engine_Version')}</Card.Col.Title>
							{appsEngineVersion}
						</Card.Col.Section>
					)}
					<Card.Col.Section>
						<Card.Col.Title>{t('Node_version')}</Card.Col.Title>
						{statistics.process.nodeVersion}
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('DB_Migration')}</Card.Col.Title>
						{`${statistics.migration.version} (${formatDateAndTime(
							statistics.migration.lockedAt,
						)})`}
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('MongoDB')}</Card.Col.Title>
						{`${statistics.mongoVersion} / ${statistics.mongoStorageEngine} (oplog ${
							statistics.oplogEnabled ? t('Enabled') : t('Disabled')
						})`}
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Commit_details')}</Card.Col.Title>
						{t('github_HEAD')}: ({commit.hash ? commit.hash.slice(0, 9) : ''}) <br />
						{t('Branch')}: {commit.branch}
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('PID')}</Card.Col.Title>
						{statistics.process.pid}
					</Card.Col.Section>
				</Card.Col>
			</Card.Body>

			{!!instances.length && (
				<Card.Footer>
					<ButtonGroup align='end'>
						<Button small onClick={handleInstancesModal}>
							{t('Instances')}
						</Button>
					</ButtonGroup>
				</Card.Footer>
			)}
		</Card>
	);
};

export default memo(DeploymentCard);
