import { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { BannersRaw } from '../../../app/models/server/raw/Banners';
import { BannersDismissRaw } from '../../../app/models/server/raw/BannersDismiss';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IBannerService } from '../../sdk/types/IBannerService';
import { BannerPlatform, IBanner, IBannerDismiss } from '../../../definition/IBanner';
import { api } from '../../sdk/api';
import { IUser } from '../../../definition/IUser';
import { Optional } from '../../../definition/utils';

export class BannerService extends ServiceClass implements IBannerService {
	protected name = 'banner';

	private Banners: BannersRaw;

	private BannersDismiss: BannersDismissRaw;

	private Users: UsersRaw;

	constructor(db: Db) {
		super();

		this.Banners = new BannersRaw(db.collection('rocketchat_banner'));
		this.BannersDismiss = new BannersDismissRaw(db.collection('rocketchat_banner_dismiss'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async getById(bannerId: string): Promise<null | IBanner> {
		return this.Banners.findOneById(bannerId);
	}

	async discardDismissal(bannerId: string): Promise<boolean> {
		const result = await this.Banners.findOneById(bannerId);

		if (!result) {
			return false;
		}

		const { _id, ...banner } = result;

		const snapshot = await this.create({ ...banner, snapshot: _id, active: false }); // create a snapshot

		await this.BannersDismiss.updateMany({ bannerId }, { $set: { bannerId: snapshot._id } });
		return true;
	}

	async create(doc: Optional<IBanner, '_id'>): Promise<IBanner> {
		const bannerId = doc._id || uuidv4();

		doc.view.appId = 'banner-core';
		doc.view.viewId = bannerId;

		await this.Banners.create({
			...doc,
			_id: bannerId,
		});

		const banner = await this.Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('error-creating-banner');
		}

		api.broadcast('banner.new', banner._id);

		return banner;
	}

	async getBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]> {
		const user = await this.Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });

		const { roles } = user || { roles: [] };

		const banners = await this.Banners.findActiveByRoleOrId(roles, platform, bannerId).toArray();

		const bannerIds = banners.map(({ _id }) => _id);

		const result = await this.BannersDismiss.findByUserIdAndBannerId<Pick<IBannerDismiss, 'bannerId'>>(userId, bannerIds, { projection: { bannerId: 1, _id: 0 } }).toArray();

		const dismissed = new Set(result.map(({ bannerId }) => bannerId));

		return banners.filter((banner) => !dismissed.has(banner._id));
	}

	async dismiss(userId: string, bannerId: string): Promise<boolean> {
		if (!userId || !bannerId) {
			throw new Error('Invalid params');
		}

		const banner = await this.Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('Banner not found');
		}

		const user = await this.Users.findOneById<Pick<IUser, 'username' | '_id'>>(userId, { projection: { username: 1 } });
		if (!user) {
			throw new Error('User not found');
		}

		const dismissedBy = {
			_id: user._id,
			username: user.username,
		};

		const today = new Date();

		const doc = {
			userId,
			bannerId,
			dismissedBy,
			dismissedAt: today,
			_updatedAt: today,
		};

		await this.BannersDismiss.insertOne(doc);

		return true;
	}

	async disable(bannerId: string): Promise<boolean> {
		const result = await this.Banners.disable(bannerId);

		if (result) {
			api.broadcast('banner.disabled', bannerId);
			return true;
		}
		return false;
	}

	async enable(bannerId: string, doc: Partial<Omit<IBanner, '_id'>> = {}): Promise<boolean> {
		const result = await this.Banners.findOneById(bannerId);

		if (!result) {
			return false;
		}

		const { _id, ...banner } = result;

		this.Banners.update({ _id }, { ...banner, ...doc, active: true }); // reenable the banner

		api.broadcast('banner.enabled', bannerId);
		return true;
	}
}
