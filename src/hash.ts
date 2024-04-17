/** 处理 hash */
const handleHash = (): void => {
	let hash = /^#L\d+$/u.test(location.hash);
	Prism.hooks.add('complete', ({element}) => {
		if (element) {
			const {dataset: {start = 1}} = element.parentElement!;
			$(element).children('.line-numbers-rows').children()
				.each((i, ele) => {
					ele.id = `L${i + Number(start)}`;
					if (hash && location.hash === `#${ele.id}`) {
						hash = false;
						ele.scrollIntoView();
					}
				})
				.click(({target: {id}}) => {
					history.replaceState(null, '', `#${id}`);
				});
		}
	});
};
export default handleHash;
