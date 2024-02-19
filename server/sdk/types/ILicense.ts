import { IServiceClass } from './ServiceClass';

export interface ILicense extends IServiceClass {
	hasLicense(feature: string): boolean;

	isEnterprise(): boolean;

	getModules(): string[];
}
