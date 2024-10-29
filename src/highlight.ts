import {CDN} from '@bhsd/common';
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mw/config';
import handleHash from './hash';
import registerWiki from './wiki';

/**
 * 生成语言正则表达式
 * @param langs 语言列表
 */
export const getRegex = (langs: Record<string, unknown>): RegExp =>
	new RegExp(String.raw`\blang(?:uage)?-(${Object.keys(langs).join('|')})\b`, 'iu');

/**
 * 获取插件路径，必须在Prism加载前调用
 * @param ext 插件扩展名
 */
const getPlugins = (ext: string): string[] =>
	Prism.pluginPaths?.filter(p => p.endsWith(ext)).map(p => `plugins/${p}`) ?? [];

/**
 * 获取 jsDelivr 路径
 * @param paths 子路径列表
 */
const getPath = (paths: string[]): string => `combine/${paths.map(s => `npm/prismjs@1.29.0/${s}`).join()}`;

/**
 * 获取脚本
 * @param src 脚本地址
 */
const getScript = (src: string): JQuery.jqXHR => $.ajax(src, {dataType: 'script', cache: true});

const core = [
		'components/prism-core.min.js',
		'plugins/line-numbers/prism-line-numbers.min.js',
		'plugins/toolbar/prism-toolbar.min.js',
		'plugins/show-language/prism-show-language.min.js',
		'plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js',
		'plugins/autolinker/prism-autolinker.min.js',
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
		wiki: [],
	},
	regex = getRegex(langs);

export const highlight = async ($block: JQuery<HTMLElement>): Promise<void> => {
	if ($block.length === 0) {
		return;
	}

	// 加载Prism
	const loaded = 'util' in Prism,
		theme = Prism.theme?.toLowerCase() || 'default',
		newLangs = [...new Set($block.map((_, {className}) => regex.exec(className)?.[1]))]
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			.filter(l => l && !Prism.languages?.[l]),
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
		mw.loader.addStyleTag(
			'#mw-content-text pre>code{margin:0;padding:0;border:none;background:none;font-size:1em;line-height:1.5}'
			+ '#mw-content-text pre[class*="language-"].line-numbers{padding-left:3.8em}'
			+ 'pre.language-wiki,code.language-wiki{white-space:pre-wrap;word-wrap:break-word}'
			+ 'code[class*="language-"] a[class*="-link"]{text-decoration:underline}'
			+ '.line-numbers .line-numbers-rows{pointer-events:all}'
			+ '.line-numbers-rows>span:hover{background:rgba(128,128,128,.2)}',
		);
		const src = `${CDN}/${getPath(['plugins/autoloader/prism-autoloader.min.js'])}`;
		Object.assign(Prism.util, {
			currentScript() {
				return {
					src,
					getAttribute: (): null => null,
				};
			},
		});
		await getScript(src);
		handleHash();
	}

	// Wiki语法高亮
	if (newLangs.includes('wiki')) {
		await getScript('//testingcf.jsdelivr.net/npm/wikiparser-node@browser/bundle/bundle.min.js');
		Parser.config = getParserConfig(Parser.getConfig(), await getMwConfig());
		registerWiki(theme);
	}

	// 执行代码高亮
	$block.filter('pre').wrapInner('<code>').children('code').add($block.filter('code'))
		.each((_, code) => {
			Prism.highlightElement(code);
		});
};
