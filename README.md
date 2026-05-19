# Prism-Wiki

[![npm version](https://badge.fury.io/js/prism-wiki.svg)](https://www.npmjs.com/package/prism-wiki)
[![CodeQL](https://github.com/bhsd-harry/prism-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/prism-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6e3f4c7dd6a94c1cb384aa929b899f5c)](https://app.codacy.com/gh/bhsd-harry/prism-wiki/dashboard)

**Prism-Wiki** is a code block highlighting gadget for MediaWiki sites, written by Bhsd. It is primarily based on [Prism](https://prismjs.com/) and uses [WikiParser-Node](https://www.npmjs.com/package/wikiparser-node) to improve [Wikitext](https://www.mediawiki.org/wiki/Wikitext) highlighting.

**Prism-Wiki** can also be used to enhance Prism's support for Wikitext highlighting in non-MediaWiki browser environments or [Node.js](https://nodejs.org/) environments, see [Node.js Usage](#nodejs-usage). An example of Node.js usage can be found from the [`<syntaxhighlight>` tag](https://bhsd-harry.github.io/wikiparser-website/Help%3ARecent_changes#L-1) rendered by [WikiParser-Node](https://www.npmjs.com/package/wikiparser-node).

## MediaWiki Gadget

### Usage

Add the following code to your *personal JS page*:

```js
mw.loader.load('//cdn.jsdelivr.net/npm/prism-wiki');
```

Or

```js
mw.loader.load('//unpkg.com/prism-wiki/dist/main.min.js');
```

All code blocks with specified languages will be automatically highlighted, while those without specified languages can be double-clicked to manually input the language and highlight.

### Configuration

Add the following code to your *personal JS page* before loading the gadget as needed:

```js
window.Prism = window.Prism || {};
Prism.theme = ''; // Theme name, optional
Prism.pluginPaths = []; // Relative paths of plugins, optional
Prism.CDN = 'https://cdn.jsdelivr.net'; // jsDelivr endpoint, optional
```

#### Theme

All available Prism themes can be found [here](https://prismjs.com/examples).

#### Relative Paths of Plugins

All available Prism plugins can be found [here](https://github.com/PrismJS/prism/tree/master/plugins). The plugin paths should be specified relative to `plugins/`. Note that some plugins include both JavaScript and CSS files, for example, to load the `autolinker` plugin:

```js
Prism.pluginPaths = [
	'autolinker/prism-autolinker.min.js',
	'autolinker/prism-autolinker.min.css',
];
```

This gadget always loads the `line-numbers`, `show-language`, `copy-to-clipboard`, and `inline-color` plugins, so there is no need to add them manually.

#### CDN

By default, this gadget loads the Prism library from `fastly.jsdelivr.net`, but you can specify other [jsDelivr CDN](https://www.jsdelivr.com/network), such as `cdn.jsdelivr.net`.

## Node.js Usage

### Installation

```bash
npm install prismjs wikilint # peer dependencies
npm install prism-wiki
```

### Example

```js
const Prism = require('prismjs'),
	Parser = require('wikilint'),
	registerWiki = require('prism-wiki').default;

registerWiki(Prism, Parser);
Prism.highlight('[[Foo]]', Prism.languages.wiki, 'wiki');
```
