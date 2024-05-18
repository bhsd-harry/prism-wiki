/**
 * @file 高亮JavaScript、CSS、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @author Bhsd <https://github.com/bhsd-harry>
 * @license GPL-3.0
 */

import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mw/config';
import handleHash from './hash';
import registerWiki from './wiki';

// @ts-expect-error 加载Prism前的预设置
window.Prism ||= {};
Prism.manual = true;

/**
 * 生成语言正则表达式
 * @param langs 语言列表
 */
const getRegex = (langs: Record<string, unknown>): RegExp =>
	new RegExp(`\\blang(?:uage)?-(${Object.keys(langs).join('|')})\\b`, 'iu');

/**
 * 获取插件路径
 * @param ext 插件扩展名
 */
const getPlugins = (ext: string): string[] =>
	Prism.pluginPaths?.filter(p => p.endsWith(ext)).map(p => `plugins/${p}`) || [];

const alias: Record<string, string> = {
		'sanitized-css': 'css',
		js: 'javascript',
		scribunto: 'lua',
		wikitext: 'wiki',
		mediawiki: 'wiki',
		mw: 'wiki',
	},
	contentModel = mw.config.get('wgPageContentModel').toLowerCase(),
	CDN = 'https://testingcf.jsdelivr.net',
	theme = Prism.theme?.toLowerCase() || 'default',
	core = [
		'components/prism-core.min.js',
		'plugins/line-numbers/prism-line-numbers.min.js',
		'plugins/toolbar/prism-toolbar.min.js',
		'plugins/show-language/prism-show-language.min.js',
		'plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js',
		...getPlugins('.js'),
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
	regex = getRegex(langs),
	regexAlias = getRegex(alias);

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

const main = async ($content: JQuery<HTMLElement>): Promise<void> => {
	// 准备DOM
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

	// 加载Prism
	const loaded = 'util' in Prism,
		newLangs = [...new Set($block.map((_, {className}) => regex.exec(className)?.[1]))]
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			.filter(l => l && !Prism.languages?.[l]),
		path = `${CDN}/${getPath([...loaded ? [] : core, ...newLangs.flatMap(l => langs[l]!)])}`;
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
				...getPlugins('.css'),
			])}`,
			'text/css',
		);
		mw.loader.addStyleTag(
			'pre>code{margin:0;padding:0;border:none;background:none}'
			+ 'pre.language-wiki,code.language-wiki{white-space:pre-wrap;word-wrap:break-word}'
			+ '.line-numbers .line-numbers-rows{pointer-events:all}'
			+ '.line-numbers-rows>span:hover{background:rgba(128,128,128,.2)}',
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

mw.hook('wikipage.content').add(($content: JQuery<HTMLElement>) => {
	void main($content);
});
