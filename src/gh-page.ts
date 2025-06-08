import {loadScript} from '@bhsd/common';
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
	await loadScript(
		'combine/'
		+ 'npm/prismjs@1.29.0/components/prism-core.min.js,'
		+ 'npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js',
		'Prism',
	);
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
})();
