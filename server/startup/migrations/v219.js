import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 219,
	up() {
		const SettingIds = {
			old: 'Livechat_auto_close_abandoned_rooms',
			new: 'Livechat_abandoned_rooms_action',
		};


		const oldSetting = Settings.findOne({ _id: SettingIds.old });
		if (!oldSetting) {
			return;
		}

		const oldValue = oldSetting.value;

		const newValue = oldValue && oldValue === true ? 'close' : 'none';

		Settings.update({
			_id: SettingIds.new,
		}, {
			$set: {
				value: newValue,
			},
		});

		Settings.remove({
			_id: SettingIds.old,
		});
	},
});
