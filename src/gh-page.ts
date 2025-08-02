import {loadScript} from '@bhsd/browser';
import registerWiki from './wiki';

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
		loadScript('npm/prismjs@1.29.0/components/prism-core.min.js', 'Prism'),
		Parser.config = await (await fetch('/wikiparser-node/config/default.json')).json(),
	]);
	registerWiki();

	let timer: NodeJS.Timeout | undefined,
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
			}, 1000);
		}
	});
	textarea.dispatchEvent(new Event('input'));
})();
