import { useCallback, useEffect } from 'react';

import { Serialized } from '../../definition/Serialized';
import { useEndpoint } from '../contexts/ServerContext';
import { Params, PathFor, Return } from '../contexts/ServerContext/endpoints';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from './useAsyncState';

const defaultParams = {};

export const useEndpointData = <P extends PathFor<'GET'>>(
	endpoint: P,
	params: Params<'GET', P>[0] = defaultParams as Params<'GET', P>[0],
	initialValue?: Serialized<Return<'GET', P>> | (() => Serialized<Return<'GET', P>>),
): AsyncState<Serialized<Return<'GET', P>>> & { reload: () => void } => {
	const { resolve, reject, reset, ...state } = useAsyncState(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData = useEndpoint('GET', endpoint);

	const fetchData = useCallback(() => {
		reset();
		getData(params)
			.then(resolve)
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getData, params, resolve, dispatchToastMessage, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
		reload: fetchData,
	};
};
