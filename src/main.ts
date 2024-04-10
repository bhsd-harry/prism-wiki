/**
 * @file 高亮JavaScript、CSS、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @author Bhsd <https://github.com/bhsd-harry>
 * @license GPL-3.0
 */

import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mw/config';
import type {Config} from 'wikiparser-node';

// @ts-expect-error 加载Prism前的预设置
window.Prism ||= {};
Prism.manual = true;
const workerJS = (config: string): void => {
	importScripts('https://testingcf.jsdelivr.net/npm/wikiparser-node@1.7.0-beta.0/bundle/bundle.min.js');
	const parserConfig: Config & {theme: string} = JSON.parse(config);
	Parser.config = parserConfig;
	const entities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;'},
		{theme} = parserConfig,
		keyword = 'keyword',
		url = 'url',
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
			'link-target': `${url} ${bold}`,
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
			'template-name': `${template} ${bold}`,
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
			'ext-link-url': url,
			'free-ext-link': url,
			list: symbol,
			dd: symbol,
			converter: selector,
			'converter-flags': punctuation,
			'converter-flag': string,
			'converter-rule': punctuation,
			'converter-rule-variant': string,
		};
	self.onmessage = ({data}: {data: string}): void => {
		const {code}: {code: string} = JSON.parse(data),
			tree = Parser.parse(code).json();
		const slice = (
			type: Types | undefined,
			parentType: Types | undefined,
			start: number,
			end: number,
		): string => {
			const text = code.slice(start, end).replace(/[&<>]/gu, p => entities[p]!);
			let t = type || parentType!;
			if (parentType === 'image-parameter') {
				t = 'root';
			} else if (type === 'converter' && text === ';') {
				t = 'converter-rule';
			}
			return t in map ? `<span class="token ${map[t]}">${text}</span>` : text;
		};
		const stack: [Tree, number][] = [];
		let cur = tree,
			index = 0,
			last = 0,
			out = false,
			output = '';
		while (last < code.length) {
			const {type, range: [, to], childNodes} = cur,
				parentNode = stack[0]?.[0];
			if (out || !childNodes?.length) {
				const [, i] = stack[0]!;
				if (last < to) {
					output += slice(type, parentNode!.type, last, to);
					last = to;
				}
				index++;
				if (index === parentNode!.childNodes!.length) {
					cur = parentNode!;
					index = i;
					stack.shift();
					out = true;
				} else {
					cur = parentNode!.childNodes![index]!;
					out = false;
					const {range: [from]} = cur;
					if (last < from) {
						output += slice(parentNode!.type, stack[1]?.[0].type, last, from);
						last = from;
					}
				}
			} else {
				const child = childNodes[0]!,
					{range: [from]} = child;
				if (last < from) {
					output += slice(type, parentNode?.type, last, from);
					last = from;
				}
				stack.unshift([cur, index]);
				cur = child;
				index = 0;
			}
		}
		postMessage(output);
		close();
	};
};
const getPath = (paths: string[]): string => `combine/${paths.map(s => `npm/prismjs@1.29.0/${s}`).join()}`;
const alias: Record<string, string> = {
		'sanitized-css': 'css',
		scribunto: 'lua',
		wikitext: 'wiki',
		mediawiki: 'wiki',
		mw: 'wiki',
	},
	contentModel = mw.config.get('wgPageContentModel').toLowerCase(),
	CDN = 'https://testingcf.jsdelivr.net',
	theme = Prism.theme?.toLowerCase() || 'default',
	{pluginPaths = [], parserConfig} = Prism,
	core = [
		'components/prism-core.min.js',
		'plugins/line-numbers/prism-line-numbers.min.js',
		'plugins/toolbar/prism-toolbar.min.js',
		'plugins/show-language/prism-show-language.min.js',
		'plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js',
		...pluginPaths.filter(p => p.endsWith('.js')).map(p => `plugins/${p}`),
	],
	langs: Record<string, string[]> = {
		css: [
			'components/prism-css.min.js',
			'components/prism-css-extras.min.js',
			'plugins/inline-color/prism-inline-color.min.js',
		],
		javascript: [
			'components/prism-clike.min.js',
			'components/prism-javascript.min.js',
			'components/prism-js-extras.min.js',
			'components/prism-javadoclike.min.js',
			'components/prism-typescript.min.js',
			'components/prism-jsdoc.min.js',
		],
		wiki: [],
	},
	regex = new RegExp(`\\blang(?:uage)?-(${Object.keys(langs).join('|')})\\b`, 'iu'),
	regexAlias = new RegExp(`\\blang(?:uage)?-(${Object.keys(alias).join('|')})\\b`, 'iu');
const main = async ($content: JQuery<HTMLElement>): Promise<void> => {
	if (contentModel === 'wikitext') {
		$content.find('pre[class*=lang-], pre[class*=language-], code[class*=lang-], code[class*=language-]').prop(
			'className',
			(_, className: string) => className.replace(regexAlias, (__, lang: string) => `lang-${alias[lang]}`)
				.replace(/\blinenums\b/u, 'line-numbers'),
		);
		$content.find('pre[lang], code[lang]').addClass(function(this: HTMLElement) {
			const lang = this.lang.toLowerCase();
			return `${this.tagName === 'PRE' ? 'line-numbers ' : ''}lang-${alias[lang] ?? lang}`;
		});
	} else {
		$content.find('.mw-code').addClass(`line-numbers lang-${alias[contentModel] || contentModel}`);
	}
	const $block = $content.find('pre, code').filter((_, {className}) => /\blang(?:uage)?-/iu.test(className));
	if ($block.length === 0) {
		return;
	}
	const loaded = 'util' in Prism,
		newLangs = [...new Set($block.map((_, {className}) => regex.exec(className)?.[1]))]
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			.filter(l => l && !Prism.languages?.[l]),
		path = `${CDN}/${getPath([...loaded ? [] : core, ...newLangs.flatMap(l => langs[l]!)])}`;
	if (!path.endsWith('/')) {
		try {
			await $.ajax(path, {dataType: 'script', cache: true});
		} catch (e) {
			void mw.notify('无法下载Prism，代码高亮失败！', {type: 'error'});
			throw e;
		}
	}
	if (!loaded) {
		mw.loader.load(
			`${CDN}/${getPath([
				`themes/prism${theme === 'default' ? '' : `-${theme}`}.min.css`,
				'plugins/line-numbers/prism-line-numbers.min.css',
				'plugins/inline-color/prism-inline-color.min.css',
				'plugins/toolbar/prism-toolbar.min.css',
				...pluginPaths.filter(p => p.endsWith('.css')).map(p => `plugins/${p}`),
			])}`,
			'text/css',
		);
		mw.loader.addStyleTag(
			'pre>code{margin:0;padding:0;border:none;background:none}'
			+ 'pre.language-wiki,code.language-wiki{white-space:pre-wrap;overflow-wrap:break-word}',
		);
		const src = `${CDN}/${getPath(['plugins/autoloader/prism-autoloader.min.js'])}`;
		Object.assign(Prism.util, {
			currentScript() {
				return {
					src,
					getAttribute: () => null,
				};
			},
		});
		await $.ajax(src, {dataType: 'script', cache: true});
		let hash = /^#L\d+$/u.test(location.hash);
		Prism.hooks.add('complete', ({element}) => {
			if (element) {
				const {dataset: {start = 1}} = element.parentElement!;
				$(element).children('.line-numbers-rows').children().each((i, ele) => {
					ele.id = `L${i + Number(start)}`;
					if (hash && location.hash === `#${ele.id}`) {
						hash = false;
						ele.scrollIntoView();
					}
				});
			}
		});
	}
	if (newLangs.includes('wiki')) {
		const config = JSON.stringify({
				...parserConfig ?? getParserConfig(
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					await (await fetch(`${CDN}/npm/wikiparser-node@browser/config/minimum.json`)).json(),
					await getMwConfig(),
				),
				theme,
			}),
			filename = URL.createObjectURL(
				new Blob([`(${String(workerJS)})('${config}')`], {type: 'text/javascript'}),
			);
		Object.assign(Prism, {filename});
		Prism.languages['wiki'] = {};
	}
	$block.filter('pre').wrapInner('<code>').children('code').add($block.filter('code'))
		.each((_, code) => {
			Prism.highlightElement(code, Prism.util.getLanguage(code) === 'wiki');
		});
};
mw.hook('wikipage.content').add(($content: JQuery<HTMLElement>) => {
	void main($content);
});
