import config, {browser} from '@bhsd/code-standard';

export default [
	...config,
	browser,
	{
		files: ['test/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './test/tsconfig.json',
			},
		},
	},
	{
		files: ['test/parserTests.json'],
		rules: {
			'no-irregular-whitespace': 0,
		},
	},
];
