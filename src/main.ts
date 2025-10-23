/**
 * @file 高亮JavaScript、CSS、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @author Bhsd <https://github.com/bhsd-harry>
 * @license GPL-3.0
 */

import highlight from './highlight';
import {getRegex} from './util';

// @ts-expect-error 加载Prism前的预设置
globalThis.Prism ??= {};
Prism.manual = true;

const alias: Record<string, string> = {
		'sanitized-css': 'css',
		js: 'javascript',
		scribunto: 'lua',
		wikitext: 'wiki',
		mediawiki: 'wiki',
		mw: 'wiki',
	},
	contentModel = mw.config.get('wgPageContentModel').toLowerCase(),
	regexAlias = getRegex(alias);

const main = async ($content: JQuery): Promise<void> => {
	mw.loader.load('oojs-ui-windows');

	// 准备DOM
	if (contentModel === 'wikitext') {
		$content.find(
			'pre[class*=lang-], pre[class*=language-], code[class*=lang-], code[class*=language-]',
		).prop(
			'className',
			(_, className: string) => className.replace(regexAlias, (__, lang: string) => `lang-${alias[lang]}`)
				.replace(/\blinenums\b/u, 'line-numbers'),
		);
		$content.find('pre[lang], code[lang]').addClass(function(this: HTMLElement) {
			const lang = this.lang.toLowerCase();
			return `${this.tagName === 'PRE' ? 'line-numbers ' : ''}lang-${alias[lang] ?? lang}`;
		});
	} else {
		$content.find('.mw-code')
			.addClass(`line-numbers lang-${alias[contentModel] ?? contentModel}`);
	}
	const $block = $content.find('pre, code')
		.filter((_, {className}) => /\blang(?:uage)?-/iu.test(className));
	await highlight($block);
	$(document.body).on('dblclick', 'pre, code', function(this: HTMLElement) {
		if (/\blang(?:uage)?-/iu.test(this.className)) {
			return;
		}
		OO.ui.prompt(
			'Language',
			{
				actions: [
					{label: mw.msg('ooui-dialog-message-reject')},
					{
						label: mw.msg('ooui-dialog-message-accept'),
						flags: ['primary', 'progressive'],
						action: 'accept',
					},
				],
			},
		).then( // eslint-disable-line promise/prefer-await-to-then
			result => {
				if (result) {
					void highlight($(this).addClass(`language-${result.toLowerCase()}`));
				}
			},
			() => {},
		);
	});
};

mw.hook('wikipage.content').add(($content: JQuery) => {
	void main($content);
});
