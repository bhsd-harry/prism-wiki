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
		Parser.config = JSON.parse(config);
		const entities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;'},
			commentType = 'comment italic',
			tagType = 'attr-name bold',
			attrType = 'attr-name',
			tableType = 'regex bold',
			syntaxType = 'atrule bold',
			linkType = 'atrule',
			templateType = 'symbol bold',
			magicType = 'property bold',
			invokeType = 'property',
			parameterType = 'symbol',
			converterType = 'operator bold',
			ruleType = 'operator',
			map: Partial<Record<Types, string>> = {
				'table-inter': 'deleted',
				hidden: commentType,
				noinclude: commentType,
				include: commentType,
				comment: commentType,
				'ext-attr-dirty': commentType,
				'html-attr-dirty': commentType,
				'table-attr-dirty': commentType,
				ext: tagType,
				html: tagType,
				'ext-attr': attrType,
				'html-attr': attrType,
				'table-attr': attrType,
				'attr-key': attrType,
				'attr-value': attrType,
				arg: tableType,
				'arg-default': 'regex',
				template: templateType,
				'template-name': templateType,
				'magic-word': magicType,
				'magic-word-name': magicType,
				'invoke-function': invokeType,
				'invoke-module': invokeType,
				parameter: parameterType,
				'parameter-key': parameterType,
				heading: linkType,
				'image-parameter': linkType,
				'heading-title': 'bold',
				table: tableType,
				tr: tableType,
				td: tableType,
				'table-syntax': tableType,
				'double-underscore': syntaxType,
				hr: syntaxType,
				quote: syntaxType,
				list: syntaxType,
				dd: syntaxType,
				'redirect-syntax': syntaxType,
				link: linkType,
				category: linkType,
				file: linkType,
				'gallery-image': linkType,
				'imagemap-image': linkType,
				'redirect-target': linkType,
				'link-target': linkType,
				'ext-link': linkType,
				'ext-link-url': linkType,
				'free-ext-link': linkType,
				converter: converterType,
				'converter-flags': converterType,
				'converter-flag': converterType,
				'converter-rule': ruleType,
				'converter-rule-variant': ruleType,
			};
		self.onmessage = ({data}: {data: string}): void => {
			const {code}: {code: string} = JSON.parse(data),
				tree = Parser.parse(code).json();
			const slice = (type: Types, start: number, end: number): string => {
				const text = code.slice(start, end).replace(/[&<>]/gu, p => entities[p]!);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				return type in map ? `<span class="token ${map[type]}">${text}</span>` : text;
			};
			const stack: [Tree, number][] = [];
			let cur = tree,
				index = 0,
				last = 0,
				out = false,
				output = '';
			while (last < code.length) {
				const {childNodes, type, range: [, to]} = cur;
				if (out) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
					if (last < to) {
						output += slice(type!, last, to);
						last = to;
					}
					const [parentNode, i] = stack[0]!;
					index++;
					if (index === parentNode.childNodes!.length) {
						cur = parentNode;
						index = i;
						stack.shift();
					} else {
						cur = parentNode.childNodes![index]!;
						out = false;
						const {range: [from]} = cur;
						if (last < from) {
							output += slice(parentNode.type!, last, from);
							last = from;
						}
					}
				} else if (childNodes?.length) {
					const child = childNodes[0]!,
						{range: [from]} = child;
					if (last < from) {
						output += slice(type!, last, from);
						last = from;
					}
					stack.unshift([cur, index]);
					cur = child;
					index = 0;
				} else {
					const {range: [from]} = cur;
					[cur, index] = stack.shift()!;
					output += slice(type || cur.type!, from, to);
					last = to;
					out = true;
				}
			}
			postMessage(output);
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
		config = JSON.stringify(Prism.parserConfig),
		theme = Prism.theme?.toLowerCase() ?? 'coy',
		{pluginPaths = []} = Prism,
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
					`themes/prism${!theme || theme === 'default' ? '' : `-${theme}`}.min.css`,
					'plugins/line-numbers/prism-line-numbers.min.css',
					'plugins/inline-color/prism-inline-color.min.css',
					'plugins/toolbar/prism-toolbar.min.css',
					...pluginPaths.filter(p => p.endsWith('.css')).map(p => `plugins/${p}`),
				])}`,
				'text/css',
			);
			mw.loader.addStyleTag('pre>code{margin:0;padding:0;border:none;background:none}');
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
		}
		$block.filter('pre').wrapInner('<code>').children('code').add($block.filter('code'))
			.each((_, code) => {
				const lang = Prism.util.getLanguage(code);
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
