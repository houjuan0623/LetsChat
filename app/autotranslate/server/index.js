/* eslint-disable import/no-duplicates */
/**
 * This file contains the exported members of the package shall be re-used.
 * @module AutoTranslate, TranslationProviderRegistry
 */

import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';
import './settings';
import './permissions';
import './autotranslate';
import './methods/getSupportedLanguages';
import './methods/saveSettings';
import './methods/translateMessage';
import './googleTranslate.js';
import './deeplTranslate.js';
import './msTranslate.js';
import './methods/getProviderUiMetadata.js';

export {
	AutoTranslate,
	TranslationProviderRegistry,
};
