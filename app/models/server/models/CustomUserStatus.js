import { Base } from './_Base';

class CustomUserStatus extends Base {
	constructor() {
		super('custom_user_status');

		this.tryEnsureIndex({ name: 1 });
	}

	// find one
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// find one by name
	findOneByName(name, options) {
		return this.findOne({ name }, options);
	}

	// find
	findByName(name, options) {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name, except, options) {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
	}

	// update
	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update({ _id }, update);
	}

	setStatusType(_id, statusType) {
		const update = {
			$set: {
				statusType,
			},
		};

		return this.update({ _id }, update);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new CustomUserStatus();
