'use strict';

const fs = require('fs'),
	esbuild = require('esbuild'),
	{version} = require('./package.json');

esbuild.buildSync({
	entryPoints: ['src/main.ts'],
	define: {
		$STYLE: JSON.stringify(
			esbuild.transformSync(
				fs.readFileSync('index.css', 'utf8'),
				{loader: 'css', minify: true},
			).code.trim(),
		),
		$VERSION: JSON.stringify(version),
	},
	charset: 'utf8',
	bundle: true,
	format: 'esm',
	outfile: 'build/main.js',
	logLevel: 'info',
});
