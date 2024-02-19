import { API } from '../api';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

(API as any).helperMethods.set('deprecationWarning', function _deprecationWarning({ endpoint, versionWillBeRemoved, response }: { endpoint: string; versionWillBeRemoved: string; response: any }) {
	const warningMessage = `The endpoint "${ endpoint }" is deprecated and will be removed after version ${ versionWillBeRemoved }`;
	apiDeprecationLogger.warn(warningMessage);
	if (process.env.NODE_ENV === 'development') {
		return {
			warning: warningMessage,
			...response,
		};
	}

	return response;
});
