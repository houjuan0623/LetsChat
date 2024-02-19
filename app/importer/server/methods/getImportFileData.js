import path from 'path';
import fs from 'fs';

import { Meteor } from 'meteor/meteor';

import { RocketChatImportFileInstance } from '../startup/store';
import { hasPermission } from '../../../authorization';
import { Imports } from '../../../models';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { Importers } from '..';

Meteor.methods({
	getImportFileData() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportFileData' });
		}

		if (!hasPermission(userId, 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'getImportFileData' });
		}

		const operation = Imports.findLastImport();
		if (!operation) {
			throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', { method: 'getImportFileData' });
		}

		const { importerKey } = operation;

		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ importerKey }) has no import class defined.`, { method: 'getImportFileData' });
		}

		importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

		const waitingSteps = [
			ProgressStep.DOWNLOADING_FILE,
			ProgressStep.PREPARING_CHANNELS,
			ProgressStep.PREPARING_MESSAGES,
			ProgressStep.PREPARING_USERS,
			ProgressStep.PREPARING_STARTED,
		];

		if (waitingSteps.indexOf(importer.instance.progress.step) >= 0) {
			if (importer.instance.importRecord && importer.instance.importRecord.valid) {
				return { waiting: true };
			}
			throw new Meteor.Error('error-import-operation-invalid', 'Invalid Import Operation', { method: 'getImportFileData' });
		}

		const readySteps = [
			ProgressStep.USER_SELECTION,
			ProgressStep.DONE,
			ProgressStep.CANCELLED,
			ProgressStep.ERROR,
		];

		if (readySteps.indexOf(importer.instance.progress.step) >= 0) {
			return importer.instance.buildSelection();
		}

		const fileName = importer.instance.importRecord.file;
		const fullFilePath = fs.existsSync(fileName) ? fileName : path.join(RocketChatImportFileInstance.absolutePath, fileName);
		const promise = importer.instance.prepareUsingLocalFile(fullFilePath);

		if (promise && promise instanceof Promise) {
			Promise.await(promise);
		}

		return importer.instance.buildSelection();
	},
});
