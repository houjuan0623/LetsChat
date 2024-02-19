import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client';
import { IBanner, BannerPlatform } from '../../definition/IBanner';
import * as banners from '../lib/banners';

const fetchInitialBanners = async (): Promise<void> => {
	const response = (await APIClient.get('v1/banners', {
		platform: BannerPlatform.Web,
	})) as {
		banners: IBanner[];
	};

	for (const banner of response.banners) {
		banners.open({
			...banner.view,
			viewId: banner.view.viewId || banner._id,
		});
	}
};

const handleBanner = async (event: { bannerId: string }): Promise<void> => {
	const response = (await APIClient.get(`v1/banners/${event.bannerId}`, {
		platform: BannerPlatform.Web,
	})) as {
		banners: IBanner[];
	};

	if (!response.banners.length) {
		return banners.closeById(event.bannerId);
	}

	for (const banner of response.banners) {
		banners.open({
			...banner.view,
			viewId: banner.view.viewId || banner._id,
		});
	}
};

const watchBanners = (): (() => void) => {
	fetchInitialBanners();

	Notifications.onLogged('banner-changed', handleBanner);

	return (): void => {
		Notifications.unLogged(handleBanner);
		banners.clear();
	};
};

Meteor.startup(() => {
	let unwatchBanners: () => void | undefined;

	Tracker.autorun(() => {
		unwatchBanners?.();

		if (!Meteor.userId()) {
			return;
		}

		unwatchBanners = Tracker.nonreactive(watchBanners);
	});
});
