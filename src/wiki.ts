/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {splitColors, normalizeTitle} from '@bhsd/common';
import type {Token} from 'prismjs';
import type {AST} from 'wikiparser-node';

export const jsonTags = new Set(['templatedata', 'maplink', 'mapframe']),
	latexTags = new Set(['math', 'chem', 'ce']);

/**
 * Wiki语法高亮
 * @param theme 主题
 */
export default (theme: string): void => {
	mw.loader.load('mediawiki.Title');

	const wiki = {};
	Prism.languages['wiki'] = wiki;

	// 自定义Wiki语法高亮
	const keyword = 'keyword',
		url = 'url',
		urlLink = 'url url-link',
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
		map: Partial<Record<Types, string>> = {
			'redirect-syntax': keyword,
			'redirect-target': url,
			'link-target': `${url} ${bold} ${mwLink}`,
			noinclude: doctype,
			include: doctype,
			comment,
			ext: tag,
			'ext-attr-dirty': comment,
			'ext-attr': punctuation,
			'attr-key': 'attr-name',
			'attr-value': 'attr-value',
			arg: variable,
			'arg-name': variable,
			hidden: comment,
			'magic-word': builtin,
			'magic-word-name': builtin,
			'invoke-function': template,
			'invoke-module': template,
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
			'magic-link': url,
			list: symbol,
			dd: symbol,
			converter: selector,
			'converter-flags': punctuation,
			'converter-flag': string,
			'converter-rule': punctuation,
			'converter-rule-variant': string,
		};

	/**
	 * 处理代码片段
	 * @param stream 流
	 * @param code 完整代码
	 */
	const getSliceFunc = (stream: (string | Prism.Token)[], code: string) => (
		type: Types | undefined,
		parentType: Types | undefined,
		start: number,
		end: number,
		childElementCount?: number,
		color?: boolean,
	): void => {
		const text = code.slice(start, end);
		let t = type ?? parentType!;
		if (!type && parentType === 'image-parameter') {
			t = 'root';
		} else if (type === 'converter' && text === ';') {
			t = 'converter-rule';
		}
		let str = map[t] ?? '';
		if (childElementCount !== 1 && str.endsWith('-link')) {
			str = str.replace(/ \S+-link$/u, '');
		}
		stream.push(color || str ? new Prism.Token((color ? 'color ' : '') + str, [text]) : text);
	};

	const {tokenize} = Prism;

	Prism.tokenize = (code, grammar): (string | Prism.Token)[] => {
		if (grammar === wiki) {
			const tree = Parser.parse(code).json(),
				stack: [Tree, number][] = [],
				output: (string | Prism.Token)[] = [];
			const slice = getSliceFunc(output, code);
			let cur = tree,
				index = 0,
				last = 0,
				out = false;

			/**
			 * 处理单个节点
			 * @param node 当前节点
			 * @param parentNode 父节点
			 */
			const push = (node: AST, parentNode: AST): void => {
				const {type, range: [, to]} = node,
					{type: parentType, childNodes: siblings, name: parentName} = parentNode,
					l = siblings!.length;
				if (last === to) {
					return;
				} else if (
					(
						parentType === 'attr-value'
						|| (parentType === 'parameter-value' || parentType === 'arg-default') && l === 1
					)
					&& !out
				) {
					for (const [, start, end, isColor] of splitColors(code.slice(last, to))) {
						slice(type, parentType, last + start, last + end, 0, isColor);
					}
					return;
				} else if (parentType === 'ext-inner') {
					if (jsonTags.has(parentName!)) {
						output.push(...Prism.tokenize(code.slice(last, to), Prism.languages['json']!));
						return;
					} else if (latexTags.has(parentName!)) {
						const tokens = Prism.tokenize(`$${code.slice(last, to)}$`, Prism.languages['latex']!),
							token = tokens[0] as Token;
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
					}
				}
				slice(type, parentType, last, to, l);
			};
			while (last < code.length) {
				const {type, range: [, to], childNodes} = cur,
					parentNode = stack[0]?.[0];
				if (out || !childNodes?.length) {
					const [, i] = stack[0]!,
						{type: parentType, childNodes: siblings} = parentNode!,
						l = siblings!.length;
					if (last < to) {
						push(cur, parentNode!);
						last = to;
					}
					index++;
					if (index === l) {
						cur = parentNode!;
						index = i;
						stack.shift();
						out = true;
					} else {
						cur = siblings![index]!;
						out = false;
						const {range: [from]} = cur;
						if (last < from) {
							slice(parentType, stack[1]?.[0].type, last, from);
							last = from;
						}
					}
				} else {
					const child = childNodes[0]!,
						{range: [from]} = child;
					if (last < from) {
						slice(type, parentNode?.type, last, from);
						last = from;
					}
					stack.unshift([cur, index]);
					cur = child;
					index = 0;
				}
			}
			return output;
		}
		return tokenize(code, grammar);
	};

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
			const ns = type.startsWith(template) ? 10 : 0,
				uri = content.startsWith('/')
					? `:${mw.config.get('wgPageName')}${content}`
					: content;
			env.attributes ??= {};
			try {
				env.attributes['href'] = new mw.Title(normalizeTitle(uri), ns).getUrl(undefined);
			} catch {}
		}
	});
};
