'use strict';

const fs = require('fs'),
	path = require('path'),
	esbuild = require('esbuild'),
	{version} = require('./package.json');

esbuild.buildSync({
	entryPoints: ['src/main.ts'],
	define: {
		$STYLE: JSON.stringify(fs.readFileSync(path.join('dist', 'index.css'), 'utf8').trim()),
		$VERSION: JSON.stringify(version),
	},
	charset: 'utf8',
	bundle: true,
	format: 'esm',
	outfile: 'build/main.js',
	logLevel: 'info',
});
