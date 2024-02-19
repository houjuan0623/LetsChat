import _ from 'underscore';

import { Base } from './_Base';

export class ExportOperations extends Base {
	constructor() {
		super('export_operations');

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ status: 1 });
	}

	// FIND
	findById(id) {
		const query = { _id: id };

		return this.find(query);
	}

	findLastOperationByUser(userId, fullExport = false, options = {}) {
		const query = {
			userId,
			fullExport,
		};

		options.sort = { createdAt: -1 };
		return this.findOne(query, options);
	}

	findPendingByUser(userId, options) {
		const query = {
			userId,
			status: {
				$nin: ['completed', 'skipped'],
			},
		};

		return this.find(query, options);
	}

	findAllPending(options) {
		const query = {
			status: { $nin: ['completed', 'skipped'] },
		};

		return this.find(query, options);
	}

	findOnePending(options) {
		const query = {
			status: { $nin: ['completed', 'skipped'] },
		};

		return this.findOne(query, options);
	}

	findAllPendingBeforeMyRequest(requestDay, options) {
		const query = {
			status: { $nin: ['completed', 'skipped'] },
			createdAt: { $lt: requestDay },
		};

		return this.find(query, options);
	}

	// UPDATE
	updateOperation(data) {
		const update = {
			$set: {
				roomList: data.roomList,
				status: data.status,
				fileList: data.fileList,
				generatedFile: data.generatedFile,
				fileId: data.fileId,
				userNameTable: data.userNameTable,
				userData: data.userData,
				generatedUserFile: data.generatedUserFile,
				generatedAvatar: data.generatedAvatar,
				exportPath: data.exportPath,
				assetsPath: data.assetsPath,
			},
		};

		return this.update(data._id, update);
	}


	// INSERT
	create(data) {
		const exportOperation = {
			createdAt: new Date(),
		};

		_.extend(exportOperation, data);

		this.insert(exportOperation);

		return exportOperation._id;
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new ExportOperations();
