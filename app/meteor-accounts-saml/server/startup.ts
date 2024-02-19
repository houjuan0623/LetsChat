import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../settings/server';
import { loadSamlServiceProviders, addSettings } from './lib/settings';
import { Logger } from '../../logger/server';
import { SAMLUtils } from './lib/Utils';

export const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);

const updateServices = _.debounce(Meteor.bindEnvironment(() => {
	loadSamlServiceProviders();
}), 2000);

Meteor.startup(() => {
	addSettings('Default');
	settings.get(/^SAML_.+/, updateServices);
});
