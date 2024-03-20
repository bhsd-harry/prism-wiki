/**
 * @file 高亮JavaScript、CSS、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @author Bhsd <https://github.com/bhsd-harry>
 * @license GPL-3.0
 */

(() => {
	// @ts-expect-error 加载Prism前的预设置
	window.Prism ||= {}; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
	Prism.manual = true;
	const workerJS = (config: string): void => {
		importScripts('https://testingcf.jsdelivr.net/npm/wikiparser-node@1.6.2-b/bundle/bundle.min.js');
		self.onmessage = ({data}: {data: string}): void => {
			const {code}: {code: string} = JSON.parse(data);
			Parser.config = JSON.parse(config);
			postMessage(Parser.parse(code).print());
			close();
		};
	};
	const getPath = (paths: string[]): string => `combine/${paths.map(s => `npm/prismjs@1.29.0/${s}`).join(',')}`;
	const alias: Record<string, string> = {
			'sanitized-css': 'css',
			scribunto: 'lua',
			wikitext: 'wiki',
			mediawiki: 'wiki',
			mw: 'wiki',
		},
		contentModel = mw.config.get('wgPageContentModel').toLowerCase(),
		core = [
			'components/prism-core.min.js',
			'plugins/line-numbers/prism-line-numbers.min.js',
			'plugins/toolbar/prism-toolbar.min.js',
			'plugins/show-language/prism-show-language.min.js',
			'plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js',
		],
		config = JSON.stringify((Prism as typeof Prism & {parserConfig?: ParserConfig}).parserConfig),
		langs: Record<string, string[]> = {
			css: [
				'components/prism-css.min.js',
				'components/prism-css-extras.min.js',
				'plugins/inline-color/prism-inline-color.min.js',
			],
			wiki: [],
		},
		regex = new RegExp(`\\blang(?:uage)?-(${Object.keys(langs).join('|')})\\b`, 'iu'),
		regexAlias = new RegExp(`\\blang(?:uage)?-(${Object.keys(alias).join('|')})\\b`, 'iu'),
		CDN = 'https://testingcf.jsdelivr.net',
		filename = URL.createObjectURL(
			new Blob([`(${String(workerJS)})('${config}')`], {type: 'application/javascript'}),
		);
	const main = async ($content: JQuery<HTMLElement>): Promise<void> => {
		if (contentModel === 'wikitext') {
			$content.find('pre[class*=lang-], pre[class*=language-], code[class*=lang-], code[class*=language-]')
				.each(function(this: HTMLElement) {
					this.className = this.className.replace(regexAlias, (_, lang: string) => `lang-${alias[lang]}`)
						.replace(/\blinenums\b/u, 'line-numbers');
				});
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
					'themes/prism-coy.min.css',
					'plugins/line-numbers/prism-line-numbers.min.css',
					'plugins/inline-color/prism-inline-color.min.css',
					'plugins/toolbar/prism-toolbar.min.css',
				])}`,
				'text/css',
			);
			mw.loader.addStyleTag('pre>code{margin:0;padding:0;border:0}');
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
		}
		if (config && newLangs.includes('wiki')) {
			Object.assign(Prism, {filename});
			Prism.languages['wiki'] = {};
			mw.loader.load(`${CDN}/npm/wikiparser-node@browser/extensions/ui.min.css`, 'text/css');
		}
		$block.filter('pre').wrapInner('<code>').children('code').add($block.filter('code'))
			.each((_, code) => {
				const lang = (Prism.util as typeof Prism.util & {getLanguage(ele: HTMLElement): string})
					.getLanguage(code);
				const callback = (): void => {
					let hash = /^#L\d+$/u.test(location.hash);
					const {dataset: {start = 1}} = code.parentElement!;
					$(code).children('.line-numbers-rows').children().each((i, ele) => {
						ele.id = `L${i + Number(start)}`;
						if (hash && location.hash === `#${ele.id}`) {
							hash = false;
							ele.scrollIntoView();
						}
					});
				};
				if (lang === 'wiki' && config) {
					Prism.highlightElement(code, true, callback);
				} else {
					Prism.highlightElement(code);
					callback();
				}
			});
	};
	mw.hook('wikipage.content').add(($content: JQuery<HTMLElement>) => {
		void main($content);
	});
})();
