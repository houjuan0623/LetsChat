import { Meteor } from 'meteor/meteor';

import {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
} from '../../contexts/ServerContext';

export const call = <M extends ServerMethodName>(
	method: M,
	...params: ServerMethodParameters<M>
): Promise<ServerMethodReturn<M>> =>
	new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (error: Error, result: ServerMethodReturn<M>) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	});
