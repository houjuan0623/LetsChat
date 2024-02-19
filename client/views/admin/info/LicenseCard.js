import { ButtonGroup, Button, Skeleton, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Card from '../../../components/Card';
import PlanTag from '../../../components/PlanTag';
import { useSetModal } from '../../../contexts/ModalContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import Feature from './Feature';
import OfflineLicenseModal from './OfflineLicenseModal';

const LicenseCard = () => {
	const t = useTranslation();

	const setModal = useSetModal();

	const currentLicense = useSetting('Enterprise_License');
	const licenseStatus = useSetting('Enterprise_License_Status');

	const isAirGapped = true;

	const { value, phase, error } = useEndpointData('licenses.get');
	const endpointLoading = phase === AsyncStatePhase.LOADING;

	const { modules = [] } =
		endpointLoading || error || !value.licenses.length ? {} : value.licenses[0];

	const hasEngagement = modules.includes('engagement-dashboard');
	const hasOmnichannel = modules.includes('livechat-enterprise');
	const hasAuditing = modules.includes('auditing');
	const hasCannedResponses = modules.includes('canned-responses');

	const handleApplyLicense = useMutableCallback(() =>
		setModal(
			<OfflineLicenseModal
				onClose={() => {
					setModal();
				}}
				license={currentLicense}
				licenseStatus={licenseStatus}
			/>,
		),
	);

	return (
		<Card>
			<Card.Title>{t('License')}</Card.Title>
			<Card.Body>
				<Card.Col>
					<Card.Col.Section>
						<PlanTag />
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Features')}</Card.Col.Title>
						<Margins block='x4'>
							{endpointLoading ? (
								<>
									<Skeleton width='40x' />
									<Skeleton width='40x' />
									<Skeleton width='40x' />
									<Skeleton width='40x' />
								</>
							) : (
								<>
									<Feature label={t('Omnichannel')} enabled={hasOmnichannel} />
									<Feature label={t('Auditing')} enabled={hasAuditing} />
									<Feature label={t('Canned_Responses')} enabled={hasCannedResponses} />
									<Feature label={t('Engagement_Dashboard')} enabled={hasEngagement} />
								</>
							)}
						</Margins>
					</Card.Col.Section>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					{isAirGapped ? (
						<Button small onClick={handleApplyLicense}>
							{t(currentLicense ? 'Cloud_Change_Offline_License' : 'Cloud_Apply_Offline_License')}
						</Button>
					) : (
						<Button small>{t('Cloud_connectivity')}</Button>
					)}
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default LicenseCard;
