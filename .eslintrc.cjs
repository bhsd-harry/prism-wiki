/* eslint-env node */
'use strict';

const config = require('@bhsd/common/eslintrc.browser.cjs');

module.exports = {
	...config,
	env: {
		...config.env,
		worker: true,
	},
};
