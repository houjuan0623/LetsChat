import React, { FC } from 'react';
import toastr from 'toastr';

import { ToastMessagesContext, ToastMessagePayload } from '../contexts/ToastMessagesContext';
import { handleError } from '../lib/utils/handleError';

const dispatch = ({ type, message, title, options }: ToastMessagePayload): void => {
	if (type === 'error' && typeof message === 'object') {
		handleError(message);
		return;
	}

	if (typeof message !== 'string') {
		message = `[${message.name}] ${message.message}`;
	}

	toastr[type](message, title, options);
};

const contextValue = {
	dispatch,
};

const ToastMessagesProvider: FC = ({ children }) => (
	<ToastMessagesContext.Provider children={children} value={contextValue} />
);

export default ToastMessagesProvider;
