import {CDN} from '@bhsd/browser';
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/dist/mwConfig.js';
import handleHash from './hash';
import registerWiki from './wiki';
import {getRegex, getPath, jsonTags, latexTags, basic} from './util';

declare const $STYLE: string,
	$VERSION: string;

/**
 * 获取插件路径，必须在Prism加载前调用
 * @param ext 插件扩展名
 */
const getPlugins = (ext: string): string[] =>
	Prism.pluginPaths?.filter(p => p.endsWith(ext)).map(p => `plugins/${p}`) ?? [];

/**
 * 获取脚本
 * @param src 脚本地址
 */
const getScript = (src: string): JQuery.jqXHR => $.ajax(src, {dataType: 'script', cache: true});

const jsonTagRegex = new RegExp(String.raw`</(?:${[...jsonTags].join('|')})\s*>`, 'iu'),
	latexTagRegex = new RegExp(String.raw`</(?:${[...latexTags].join('|')})\s*>`, 'iu'),
	lilypondTagRegex = /<\/score\s*>/iu,
	core = [
		...basic,
		'plugins/toolbar/prism-toolbar.min.js',
		'plugins/show-language/prism-show-language.min.js',
		'plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js',
		'plugins/line-highlight/prism-line-highlight.min.js',
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
		json: ['components/prism-json.min.js'],
		latex: ['components/prism-latex.min.js'],
		lilypond: [
			'components/prism-scheme.min.js',
			'components/prism-lilypond.min.js',
		],
		wiki: [],
	},
	regex = getRegex(langs);

export default async ($block: JQuery): Promise<void> => {
	if ($block.length === 0) {
		return;
	}

	// 加载Prism
	const loaded = 'util' in Prism,
		theme = Prism.theme?.toLowerCase() ?? 'default',
		newLangs = [
			...new Set($block.map((_, {className, textContent}) => {
				const lang = regex.exec(className)?.[1]?.toLowerCase();
				if (lang === 'wiki') {
					const results = ['wiki'];
					if (jsonTagRegex.test(textContent!)) {
						results.push('json');
					}
					if (latexTagRegex.test(textContent!)) {
						results.push('latex');
					}
					if (lilypondTagRegex.test(textContent!)) {
						results.push('lilypond');
					}
					return results;
				}
				return lang;
			})),
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		].filter(l => l && !Prism.languages?.[l]),
		cssPlugins = getPlugins('.css'),
		path = `${CDN}/${
			getPath([
				...loaded ? [] : core,
				...newLangs.flatMap(l => langs[l]!),
				...loaded ? [] : getPlugins('.js'),
			])
		}`;
	if (!path.endsWith('/')) {
		try {
			await getScript(path);
		} catch (e) {
			void mw.notify('无法下载Prism，代码高亮失败！', {type: 'error'});
			throw e;
		}
	}
	if (!loaded) {
		Object.assign(Prism, {version: $VERSION});
		mw.loader.load(
			`${CDN}/${getPath([
				`themes/prism${theme === 'default' ? '' : `-${theme}`}.min.css`,
				'plugins/line-numbers/prism-line-numbers.min.css',
				'plugins/inline-color/prism-inline-color.min.css',
				'plugins/toolbar/prism-toolbar.min.css',
				'plugins/autolinker/prism-autolinker.min.css',
				'plugins/line-highlight/prism-line-highlight.min.css',
				...cssPlugins,
			])}`,
			'text/css',
		);
		mw.loader.addStyleTag($STYLE);
		const src = `${CDN}/${getPath(['plugins/autoloader/prism-autoloader.min.js'])}`;
		Object.assign(Prism.util, {
			currentScript(): Pick<HTMLScriptElement, 'src' | 'getAttribute'> {
				return {
					src,
					getAttribute(): null {
						return null;
					},
				};
			},
		});
		await getScript(src);
		handleHash();
	}

	// Wiki语法高亮
	if (newLangs.includes('wiki')) {
		await getScript(`${CDN}/npm/wikiparser-node/bundle/bundle.min.js`);
		Parser.config = getParserConfig(Parser.getConfig(), await getMwConfig({}));
		registerWiki(theme);
	}

	// 执行代码高亮
	$block.filter('pre').wrapInner('<code>').children('code')
		.add($block.filter('code'))
		.each((_, code) => {
			$(code).data('raw', code.textContent);
			Prism.highlightElement(code);
		});
	Prism.hooks.add('complete', ({element}) => {
		if (element && element.textContent !== $(element).data('raw')) {
			console.error('Prism代码高亮失败！', element);
		}
	});
};
