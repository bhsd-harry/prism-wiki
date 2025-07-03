/* eslint-env node */
'use strict';

const config = require('@bhsd/code-standard/eslintrc.browser.cjs');

module.exports = {
	...config,
	env: {
		...config.env,
		worker: true,
	},
	overrides: [
		...config.overrides,
		{
			files: 'test/*.ts',
			parserOptions: {
				project: './test/tsconfig.json',
			},
		},
		{
			files: 'test/parserTests.json',
			rules: {
				'no-irregular-whitespace': 0,
			},
		},
	],
};
