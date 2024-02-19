import React, { memo } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { clickableItem } from '../../../../lib/clickableItem';
import DiscussionListMessage from './components/Message';
import { mapProps } from './mapProps';
import { normalizeThreadMessage } from './normalizeThreadMessage';

const Discussion = memo(mapProps(clickableItem(DiscussionListMessage)));

const Row = memo(function Row({ discussion, showRealNames, userId, onClick }) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return (
		<Discussion
			replies={discussion.replies}
			dcount={discussion.dcount}
			dlm={discussion.dlm}
			name={showRealNames ? name : discussion.u.username}
			username={discussion.u.username}
			following={discussion.replies && discussion.replies.includes(userId)}
			data-drid={discussion.drid}
			msg={msg}
			t={t}
			formatDate={formatDate}
			onClick={onClick}
		/>
	);
});

export default Row;
