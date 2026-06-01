import {loadScript} from '@bhsd/browser';
import registerWiki from './wiki.js';
import {getPath, basic} from './util.js';

Object.assign(globalThis, {
	mw: {
		loader: {
			load() {
				//
			},
		},
		config: {
			get() {
				return '';
			},
		},
	},
});

(async () => {
	await Promise.all([
		loadScript(
			getPath([
				...basic,
				'components/prism-json.min.js',
				'components/prism-latex.min.js',
				'components/prism-scheme.min.js',
				'components/prism-lilypond.min.js',
			]),
			'Prism',
		),
		Parser.config = await (await fetch('/wikiparser-node/config/default.json')).json(),
	]);
	registerWiki(Prism, Parser);

	let timer: number | undefined,
		highlighting = false;
	const textarea = document.querySelector('textarea')!,
		pre = document.querySelector('pre')!;
	textarea.addEventListener('input', () => {
		if (timer) {
			clearTimeout(timer);
		}
		if (!highlighting) {
			timer = setTimeout(() => {
				pre.firstElementChild!.textContent = textarea.value;
				highlighting = true;
				Prism.highlightElement(pre.firstElementChild!, false, () => {
					highlighting = false;
				});
			}, 1000) as unknown as number;
		}
	});
	textarea.dispatchEvent(new InputEvent('input'));
})();
