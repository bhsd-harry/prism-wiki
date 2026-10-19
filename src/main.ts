/**
 * @file 高亮JavaScript、CSS、Lua和Wikitext，按行号跳转，并添加行号和指示色块
 * @author Bhsd <https://github.com/bhsd-harry>
 * @license GPL-3.0-or-later
 */

import {CDN, isGlobal} from '@bhsd/browser';
import highlight from './highlight.js';
import {getRegex} from './util.js';

if (!isGlobal('Prism')) {
	Object.assign(globalThis, {
		Prism: {manual: true},
	});
}

const alias: Record<string, string> = {
		'sanitized-css': 'css',
		js: 'javascript',
		scribunto: 'lua',
		wikitext: 'wiki',
		mediawiki: 'wiki',
		mw: 'wiki',
	},
	contentModel = mw.config.get('wgPageContentModel'),
	regexAlias = getRegex(alias);

const getAlias = (language: string): string => {
	const lang = language.toLowerCase();
	return `lang-${alias[lang] ?? lang}`;
};

const highlightWithLines = ($block: JQuery, cdn: string): Promise<void> => {
	const $parent = $block.parent();
	if ($parent.hasClass('mw-highlight-lines')) {
		$block.addClass('line-numbers');
	}
	$parent.removeClass('mw-highlight mw-highlight-lines');
	return highlight($block.removeClass('mw-highlight'), cdn);
};

const setSyntaxHighlightLang = (ele: HTMLElement): boolean => {
	const target = ele.tagName === 'CODE' ? ele : ele.parentElement,
		mt = target && /(?<!\S)mw-highlight-lang-([\w-]+)(?!\S)/u.exec(target.className);
	if (mt) {
		ele.classList.add(getAlias(mt[1]!));
		return true;
	}
	return false;
};

const main = async ($content: JQuery, cdn = CDN): Promise<void> => {
	mw.loader.load('oojs-ui-windows');

	// 准备DOM
	if (contentModel === 'wikitext') {
		$content.find(
			'pre[class*=lang-], pre[class*=language-], code[class*=lang-], code[class*=language-]',
		).prop(
			'className',
			(_, className: string) => className.replace(regexAlias, (__, lang: string) => getAlias(lang))
				.replace(/(?<!\S)linenums(?!\S)/u, 'line-numbers'),
		);
		$content.find('pre[lang], code[lang]').addClass(function(this: HTMLElement) {
			return (this.tagName === 'PRE' ? 'line-numbers ' : '') + getAlias(this.lang);
		});
	} else {
		$content.find('.mw-code')
			.addClass(`line-numbers ${getAlias(contentModel)}`);
	}
	if (Prism.reHighlight) {
		$content.find('code.mw-highlight, div.mw-highlight > pre').each((_, ele) => {
			setSyntaxHighlightLang(ele);
		});
	}
	const $block = $content.find('pre, code')
		.filter((_, {className}) => /(?<!\S)lang(?:uage)?-/iu.test(className));
	await highlightWithLines($block, cdn);
	$(document.body).on('dblclick', 'pre, code', function(this: HTMLElement) {
		if (/(?<!\S)lang(?:uage)?-/iu.test(this.className)) {
			return;
		} else if (setSyntaxHighlightLang(this)) {
			void highlightWithLines($(this), cdn);
			return;
		}
		(async () => {
			try {
				const result = await OO.ui.prompt(
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
				);
				if (result) {
					void highlightWithLines($(this).addClass(getAlias(result)), cdn);
				}
			} catch {}
		})();
	});
};

mw.hook('wikipage.content').add(($content: JQuery) => {
	void main($content, Prism.CDN);
});
