import {splitColors} from '@bhsd/common';
import {normalizeTitle} from '@bhsd/browser';
import {jsonTags, latexTags} from './util';
import type * as PrismJS from 'prismjs';
import type WikiParser from 'wikilint';
import type {
	TokenTypes,
	AstNodes,
	Token as AstToken,
	AstText,
	ExtToken,
	TranscludeToken,
	AttributeToken,
} from 'wikilint';

/**
 * 获取节点的终点
 * @param node 节点
 */
// eslint-disable-next-line @typescript-eslint/no-base-to-string
const getTo = (node: AstNodes): number => node.getAbsoluteIndex() + String(node).length;

/**
 * Wiki语法高亮
 * @param Prism Prism对象
 * @param Parser Wikitext解析器
 * @param theme 主题
 */
export default (Prism: typeof PrismJS, Parser: typeof WikiParser, theme?: string): void => {
	const wiki = {};
	Prism.languages['wiki'] = wiki;
	Object.assign(Parser, {internal: true});

	// 自定义Wiki语法高亮
	const keyword = 'keyword',
		url = 'url',
		urlLink = 'url url-link',

		/**
		 * `link-target` (including `gallery-image > link-target`) \
		 * `invoke-module` \
		 * `template-name` \
		 * `magic-link` \
		 * `ext-attrs#templatestyles > ext-attr#src`
		 */
		mwLink = 'mw-link',
		bold = 'bold',
		doctype = 'doctype',
		comment = 'comment',
		tag = 'tag',
		punctuation = 'punctuation',
		variable = 'variable',
		builtin = 'builtin',
		template = theme === 'dark' || theme === 'funky' ? 'builtin' : 'function',
		symbol = 'symbol',
		selector = 'selector',
		string = 'string',
		attrValue = 'attr-value',
		map: Partial<Record<TokenTypes, string>> = {
			'redirect-syntax': keyword,
			'redirect-target': url,
			'link-target': `${url} ${bold} ${mwLink}`,
			translate: tag,
			'translate-attr': 'attr-name',
			tvar: tag,
			'tvar-name': attrValue,
			noinclude: doctype,
			include: doctype,
			comment,
			ext: tag,
			'ext-attr-dirty': comment,
			'ext-attr': punctuation,
			'attr-key': 'attr-name',
			'attr-value': attrValue,
			arg: variable,
			'arg-name': variable,
			hidden: comment,
			'magic-word': builtin,
			'magic-word-name': builtin,
			'invoke-function': template,
			'invoke-module': `module ${template} ${mwLink}`,
			template,
			'template-name': `${template} ${bold} ${mwLink}`,
			parameter: punctuation,
			'parameter-key': variable,
			heading: symbol,
			'heading-title': bold,
			html: tag,
			'html-attr-dirty': comment,
			'html-attr': punctuation,
			table: symbol,
			tr: symbol,
			td: symbol,
			'table-syntax': symbol,
			'table-attr-dirty': comment,
			'table-attr': punctuation,
			'table-inter': 'deleted',
			hr: symbol,
			'double-underscore': 'constant',
			link: url,
			category: url,
			file: url,
			'gallery-image': url,
			'imagemap-image': url,
			'image-parameter': keyword,
			quote: `${symbol} ${bold}`,
			'ext-link': url,
			'ext-link-url': urlLink,
			'free-ext-link': urlLink,
			'magic-link': `magic ${url} ${mwLink}`,
			list: symbol,
			dd: symbol,
			converter: selector,
			'converter-flags': punctuation,
			'converter-flag': string,
			'converter-rule': punctuation,
			'converter-rule-variant': string,
		};

	const {tokenize} = Prism;

	Prism.tokenize = (s, grammar): (string | PrismJS.Token)[] => {
		if (grammar === wiki) {
			const code = s.replace(/[\0\x7F]/gu, ''),
				root = Parser.parse(code),
				output: (string | PrismJS.Token)[] = [];
			let cur: AstNodes = root,
				last = 0,
				out = false;

			/**
			 * 处理代码片段
			 * @param node 当前节点
			 * @param node.type 节点类型
			 * @param node.parentNode 父节点
			 * @param text 代码片段
			 * @param complex 是否复杂节点
			 * @param color 是否颜色
			 */
			const slice = (
				node: {type: TokenTypes | 'text', parentNode?: AstToken | undefined},
				text: string,
				complex = true,
				color?: boolean,
			): void => {
				if (!text) {
					return;
				}
				const {type, parentNode} = node,
					grandParent = parentNode?.parentNode,
					pType = parentNode?.type;
				let t = type === 'text' ? pType! : type;
				if (type === 'text' && pType === 'image-parameter') { // 图片参数中的`$1`
					t = 'root';
				} else if (type === 'converter' && text === ';') {
					t = 'converter-rule';
				}
				let str = (color ? 'color ' : '')
					+ (t === 'link-target' && grandParent?.is('gallery-image') ? 'gallery ' : '')
					+ (
						t === 'link-target' && grandParent?.is('ext-inner') && grandParent.name === 'categorytree'
							? 'categorytree '
							: ''
					)
					+ (map[t] ?? '')
					+ (
						t === 'attr-value'
						&& grandParent?.is<AttributeToken>('ext-attr')
						&& grandParent.name === 'src'
						&& grandParent.tag === 'templatestyles'
							? ` ${mwLink}`
							: ''
					);
				if (complex && str.endsWith('-link')) { // 复杂节点不标记链接
					str = str.replace(/(?:^| )\S+-link$/u, '');
				}
				output.push(str ? new Prism.Token(str, [text]) : text);
			};

			/**
			 * 处理准文本节点
			 * @param node 当前节点
			 */
			const push = (node: AstNodes): void => {
				const to = getTo(node);
				if (last === to) {
					return;
				}
				const {parentNode} = node,
					{type: pType, name: pName, length: l} = parentNode!,
					text = code.slice(last, to);
				if (
					!out
					&& (pType === 'attr-value' || (pType === 'parameter-value' || pType === 'arg-default') && l === 1)
				) {
					for (const [, start, end, isColor] of splitColors(text)) {
						slice(node, text.slice(start, end), false, isColor);
					}
					return;
				} else if (pType === 'ext-inner') {
					if (jsonTags.has(pName!)) {
						output.push(...Prism.tokenize(text, Prism.languages['json']!));
						return;
					} else if (latexTags.has(pName!)) {
						const tokens = Prism.tokenize(`$${text}$`, Prism.languages['latex']!),
							token = tokens[0] as PrismJS.Token;
						if (tokens.length === 1 && token.type === 'equation') {
							const {content} = token;
							if (typeof content === 'string') {
								token.content = content.slice(1, -1);
								output.push(token);
								return;
							} else if (Array.isArray(content)) {
								const {length: n} = content;
								try {
									content[0] = (content[0] as string).slice(1);
									content[n - 1] = (content[n - 1] as string).slice(0, -1);
									output.push(token);
									return;
								} catch {}
							}
						}
					} else if (pName === 'score') {
						const lang = (parentNode!.parentNode as ExtToken).getAttr('lang');
						if (lang === undefined || lang === 'lilypond') {
							output.push(...Prism.tokenize(text, Prism.languages['lilypond']!));
							return;
						}
					}
				}
				slice(node, text, l !== 1);
			};

			while (last < code.length) {
				const {firstChild, parentNode} = cur as AstToken | AstText,
					to = getTo(cur);
				if (out || !firstChild) {
					if (last < to) {
						if (out) {
							slice(cur, code.slice(last, to));
						} else {
							push(cur);
						}
						last = to;
					}
					if (parentNode!.lastChild === cur) {
						cur = parentNode!;
						out = true;
					} else {
						cur = cur.nextSibling!;
						out = false;
						const from = cur.getAbsoluteIndex();
						if (last < from) {
							slice(parentNode!, code.slice(last, from));
							last = from;
						}
					}
				} else {
					const from = firstChild.getAbsoluteIndex();
					if (last < from) {
						if (cur.is<TranscludeToken>('template') && cur.modifier) {
							slice(cur, code.slice(last, last + 2), false);
							slice({type: 'magic-word-name'}, code.slice(last + 2, from), false);
						} else {
							slice(cur, code.slice(last, from));
						}
						last = from;
					}
					cur = firstChild;
				}
			}
			return output;
		}
		return tokenize(s, grammar);
	};

	if (typeof mw === 'object') {
		mw.loader.load('mediawiki.Title');

		Prism.hooks.add('wrap', env => {
			const {content, language, type} = env;
			if (language !== 'wiki' || content === undefined) {
				//
			} else if (type?.startsWith('color')) {
				env.content =
					`<span class="inline-color-wrapper"><span class="inline-color" style="background-color:${
						content
					};"></span></span>${content}`;
			} else if (type?.endsWith(mwLink)) {
				env.attributes ??= {};
				let ns = 0,
					uri = content;
				if (type.startsWith('magic ')) { // magic-link
					if (!content.startsWith('ISBN')) {
						env.attributes['href'] = content.startsWith('RFC')
							? `https://datatracker.ietf.org/doc/html/rfc${content.slice(3).trim()}`
							: `https://pubmed.ncbi.nlm.nih.gov/${content.slice(4).trim()}`;
						return;
					}
					ns = -1;
					uri = `BookSources/${content.slice(4).trim()}`;
				} else if (type.startsWith('module ')) { // invoke-module
					uri = `Module:${content}`;
				} else if (type.includes('gallery ')) { // gallery-image > link-target
					ns = 6;
				} else if (type.includes('categorytree ')) { // ext-inner > link-target
					ns = 14;
				} else if (type.includes(attrValue)) { // ext-attrs#templatestyles > ext-attr#src
					ns = 10;
				} else if (content.startsWith('/')) { // link-target, template-name
					uri = `:${mw.config.get('wgPageName')}${content}`;
				} else if (type.startsWith(template)) { // template-name
					ns = 10;
				}
				try {
					env.attributes['href'] = new mw.Title(normalizeTitle(uri), ns).getUrl(undefined);
				} catch {}
			}
		});
	}
};
