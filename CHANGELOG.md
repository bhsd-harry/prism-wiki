<!-- markdownlint-disable first-line-h1 -->
## 1.0.0

*2025-11-16*

**Changed**

- When used in a Node.js environment, the default export function now requires the `Prism` instance as the first argument and the WikiParser-Node module as the second argument.

## 0.5.0

*2025-11-15*

**Added**

- Prism-Wiki now supports Node.js environments
- Auto-linking for the `src` attribute of `<templatestyles>` extension tags in Wikitext code blocks
- Auto-linking for Scribunto module invocations in Wikitext code blocks
- Auto-linking for magic links (`ISBN`, `PMID` and `RFC`) in Wikitext code blocks

**Fixed**

- Auto-linking for gallery images in Wikitext code blocks

## 0.4.5

*2025-10-22*

**Changed**

- Styles for `<tvar>` names in Wikitext code blocks

## 0.4.4

*2025-09-26*

**Added**

- Highlight `<tvar>` tags in Wikitext code blocks

## 0.4.3

*2025-06-09*

**Changed**

- Template modifiers (e.g., `subst:`) are now highlighted as magic words in Wikitext code blocks

## v0.4.2

*2025-04-16*

**Added**

- Support [Extension:Translate](https://www.mediawiki.org/wiki/Extension:Translate) in Wikitext code blocks

## v0.4.1

*2025-03-24*

**Fixed**

- Remove invisible characters `\0` and `\x7F` from Wikitext code blocks

## v0.4.0

*2025-03-09*

**Added**

- JSON/Math/LilyPond content of extension tags (`templatedata`, `maplink`, `mapframe`, `math`, `chem`, `ce`, and `score`) is now highlighted in Wikitext code blocks

**Fixed**

- Class names for code blocks can now be case-insensitive

## v0.3.4

*2025-01-16*

**Fixed**

- No inline colors for HTML entity numbers in Wikitext code blocks

## v0.3.3

*2024-11-03*

**Fixed**

- Tokens inside image parameters in Wikitext code blocks are now highlighted correctly
- Only well-defined wiki links are auto-linked in Wikitext code blocks

**Changed**

- Inline colors for argument default values in Wikitext code blocks

## v0.3.2

*2024-10-30*

**Changed**

- Style hyperlinks with `text-decoration: underline` in code blocks

## v0.3.1

*2024-10-27*

**Added**

- Use `data-line` attribute to highlight lines in code blocks

**Fixed**

- CSS precedence for some MediaWiki skins

**Changed**

- Inline colors for parameter values in Wikitext code blocks

## v0.3.0

*2024-10-27*

**Added**

- Auto-linking for URLs and wiki links in code blocks

## v0.2.1

*2024-10-26*

**Added**

- Double-click to highlight a code block without predefined language

**Fixed**

- Load user-specified plugins that depend on certain languages

## v0.2.0

*2024-10-26*

**Added**

- Inline colors for Wikitext code blocks

## v0.1.1

*2024-04-18*

**Fixed**

- Missing alias `js` for JavaScript

## v0.1.0

*2024-04-17*

**Added**

- Clickable line numbers in code blocks that modify the hash of the URL

**Changed**

- Highlight Wikitext syncronously

## v0.0.5

*2024-04-10*

**Added**

- Highlight JSDoc comments in JavaScript code blocks

## v0.0.4

*2024-03-25*

**Fixed**

- Use `white-space: pre-wrap` for Wikitext

**Changed**

- Highlight style for Wikitext
- Use [Prism's default theme](https://github.com/PrismJS/prism/blob/master/themes/prism.css)

## v0.0.3

*2024-03-24*

**Added**

- Allow users to specify the theme and plugins
- Automatically load the site-specific parser configuration for Wikitext

## v0.0.0

*2024-03-21*

First published version
