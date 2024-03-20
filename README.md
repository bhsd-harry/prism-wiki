# Prism-Wiki

[![npm version](https://badge.fury.io/js/prism-wiki.svg)](https://www.npmjs.com/package/prism-wiki)
[![CodeQL](https://github.com/bhsd-harry/prism-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/prism-wiki/actions/workflows/github-code-scanning/codeql)

**Prism-Wiki** 是由 Bhsd 编写的一款用于 MediaWiki 站点的代码块高亮小工具，主要基于 [Prism](https://prismjs.com/)，并使用 [WikiParser-Node](https://github.com/bhsd-harry/wikiparser-node) 改进对[维基文本](https://www.mediawiki.org/wiki/Wikitext)的高亮模式。

## 使用方法

在*个人 JS 页*添加以下代码：

```javascript
mw.loader.load('//cdn.jsdelivr.net/npm/prism-wiki');
```

或

```javascript
mw.loader.load('//unpkg.com/prism-wiki');
```

[GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0-standalone.html)
