# Prism-Wiki

[![npm version](https://badge.fury.io/js/prism-wiki.svg)](https://www.npmjs.com/package/prism-wiki)
[![CodeQL](https://github.com/bhsd-harry/prism-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/prism-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6e3f4c7dd6a94c1cb384aa929b899f5c)](https://app.codacy.com/gh/bhsd-harry/prism-wiki/dashboard)

**Prism-Wiki** 是由 Bhsd 编写的一款用于 MediaWiki 站点的代码块高亮小工具，主要基于 [Prism](https://prismjs.com/)，并使用 [WikiParser-Node](https://www.npmjs.com/package/wikiparser-node) 改进对[维基文本](https://www.mediawiki.org/wiki/Wikitext)的高亮模式。

**Prism-Wiki** 也能用于在非 MediaWiki 的浏览器或 [Node.js](https://nodejs.org/) 环境下改进 [Prism](https://prismjs.com/) 对[维基文本](https://www.mediawiki.org/wiki/Wikitext)的高亮支持，详见 [Node.js 用法](#nodejs-用法)。使用案例可以参考 [WikiParser-Node](https://www.npmjs.com/package/wikiparser-node) 渲染的 [`<syntaxhighlight>` 标签](https://bhsd-harry.github.io/wikiparser-website/Help%3ARecent_changes#L-1)。

## MediaWiki 站点小工具

### 使用方法

在*个人 JS 页*添加以下代码：

```js
mw.loader.load('//cdn.jsdelivr.net/npm/prism-wiki');
```

或

```js
mw.loader.load('//unpkg.com/prism-wiki/dist/main.min.js');
```

所有指定了语言的代码块都会被自动高亮，未指定语言的代码块可以双击后手动输入语言并高亮。

### 设置

根据需要在加载小工具之前添加以下代码：

```js
window.Prism = window.Prism || {};
Prism.theme = ''; // 主题，可省略
Prism.pluginPaths = []; // 插件相对路径，可省略
```

#### 主题

所有可用的 Prism 主题都可以在[这里](https://prismjs.com/examples)找到。

#### 插件相对路径

所有可用的 Prism 插件都可以在[这里](https://github.com/PrismJS/prism/tree/master/plugins)找到。插件路径需相对于 `plugins/` 填写，注意有些插件同时包含了 JavaScript 和 CSS 文件，例如加载 `autolinker` 插件：

```js
Prism.pluginPaths = [
	'autolinker/prism-autolinker.min.js',
	'autolinker/prism-autolinker.min.css',
];
```

小工具总是加载 `line-numbers`、`show-language`、`copy-to-clipboard` 和 `inline-color` 插件，不需要手动添加。

## Node.js 用法

### 安装

```bash
npm install prismjs wikilint # peer dependencies
npm install prism-wiki
```

### 示例

```js
const Prism = require('prismjs'),
	Parser = require('wikilint'),
	registerWiki = require('prism-wiki').default;

registerWiki(Prism, Parser);
Prism.highlight('[[Foo]]', Prism.languages.wiki, 'wiki');
```
