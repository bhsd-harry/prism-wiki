# Prism-Wiki

[![npm version](https://badge.fury.io/js/prism-wiki.svg)](https://www.npmjs.com/package/prism-wiki)
[![CodeQL](https://github.com/bhsd-harry/prism-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/prism-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6e3f4c7dd6a94c1cb384aa929b899f5c)](https://app.codacy.com/gh/bhsd-harry/prism-wiki/dashboard)

## Other Languages

- [简体中文](./README-%28ZH%29.md)

## Introduction

**Prism-Wiki** is a code block highlighting gadget for MediaWiki sites, written
by Bhsd. It is primarily based on [Prism](https://prismjs.com/) and uses
[WikiParser-Node](https://www.npmjs.com/package/wikiparser-node) to improve
[Wikitext](https://www.mediawiki.org/wiki/Wikitext) highlighting.

**Prism-Wiki** can also be used to enhance Prism's support for Wikitext
highlighting in non-MediaWiki browser environments or [Node.js](https://nodejs.org/)
environments, see [Node.js Usage](#nodejs-usage). An example of Node.js usage
can be found from the [`<syntaxhighlight>` tag](https://bhsd-harry.github.io/wikiparser-website/Help%3ARecent_changes#L-1)
rendered by [WikiParser-Node](https://www.npmjs.com/package/wikiparser-node).

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

All code blocks with specified languages will be automatically highlighted,
while those without specified languages can be double-clicked to manually input
the language and highlight.

### Configuration

Add the following code to your *personal JS page* before loading the gadget as needed:

```js
window.Prism = window.Prism || {};
Prism.theme = ''; // Theme name, optional
Prism.pluginPaths = []; // Relative paths of plugins, optional
Prism.CDN = 'https://cdn.jsdelivr.net'; // jsDelivr endpoint, optional
Prism.reHighlight = true; // Re-highlight code blocks highlighted by Extension:SyntaxHighlight, optional
```

#### Theme

All available Prism themes can be found [here](https://prismjs.com/examples).

#### Relative Paths of Plugins

All available Prism plugins can be found [here](https://github.com/PrismJS/prism/tree/master/plugins).
The plugin paths should be specified relative to `plugins/`. Note that some
plugins include both JavaScript and CSS files, for example, to load the
[`match-braces`](https://prismjs.com/plugins/match-braces/) plugin:

```js
Prism.pluginPaths = [
	'match-braces/prism-match-braces.min.js',
	'match-braces/prism-match-braces.min.css',
];
```

This gadget always loads the [`autolinker`](https://prismjs.com/plugins/autolinker),
[`copy-to-clipboard`](https://prismjs.com/plugins/copy-to-clipboard/),
[`inline-color`](https://prismjs.com/plugins/inline-color), [`line-highlight`](https://prismjs.com/plugins/line-highlight/),
[`line-numbers`](https://prismjs.com/plugins/line-numbers/), and
[`show-language`](https://prismjs.com/plugins/show-language/) plugins, so there
is no need to add them manually.

#### CDN

By default, this gadget loads the Prism library from `fastly.jsdelivr.net`, but
you can specify other [jsDelivr CDN](https://www.jsdelivr.com/network), such as
`cdn.jsdelivr.net`.

#### Re-highlight \<syntaxhighlight\>

By default, this gadget does not touch code blocks that have already been
highlighted by [Extension:SyntaxHighlight](https://www.mediawiki.org/wiki/Extension:SyntaxHighlight).
If you want to re-highlight them, set `Prism.reHighlight` to `true`.

### Features

#### Language

The `lang="..."` attribute or the `lang-...`/`language-...` class of a `<pre>`
or `<code>` tag specifies the language of the code block:

```html
<pre lang="wiki">[[Foo]]</pre>
```

or

```html
<pre class="lang-js">'bar'</pre>
```

or

```html
<pre class="language-css">#baz {}</pre>
```

#### Line Numbers

To enable line numbers, specify the language of the code block using the `lang="..."`
attribute or add the `line-numbers` or `linenums` class to the `<pre>` tag:

```html
<pre lang="wiki">[[Foo]]</pre>
```

or

```html
<pre class="lang-js line-numbers">'bar'</pre>
```

or

```html
<pre class="language-css linenums">#baz {}</pre>
```

To define the starting line number, add the `data-start` attribute to the `<pre>`
tag:

```html
<pre lang="wiki" data-start="5">[[Foo]]</pre>
```

#### Line Highlight

To highlight specific lines, add the `data-line` attribute to the `<pre>` tag:

```html
<pre class="lang-css linenums" data-line="1,3-4">
#baz::after {

	content: 'qux';

}
</pre>
```

## Node.js Usage

### Installation

```bash
npm install prism-wiki
# peer dependencies; wikilint can be replaced by wikiparser-node
npm install prismjs wikilint
```

### Example

```js
const Prism = require('prismjs'),
	Parser = require('wikilint'),
	registerWiki = require('prism-wiki').default;

registerWiki(Prism, Parser);
Prism.highlight('[[Foo]]', Prism.languages.wiki, 'wiki');
```
