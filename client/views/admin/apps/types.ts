import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

export type App = {
	id: string;
	iconFileData: string;
	name: string;
	author: {
		name: string;
		homepage: string;
		support: string;
	};
	description: string;
	categories: string[];
	version: string;
	price: string;
	purchaseType: unknown[];
	pricingPlans: unknown[];
	iconFileContent: unknown;
	installed?: boolean;
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
	}[];
	marketplaceVersion: string;
	latest: App;
	status?: AppStatus;
	licenseValidation?: {
		errors: { [key: string]: string };
		warnings: { [key: string]: string };
	};
	marketplace: unknown;
	permissions: unknown[];
};
