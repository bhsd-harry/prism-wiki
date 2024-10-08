/**
 * Wiki语法高亮
 * @param theme 主题
 */
const registerWiki = (theme: string): void => {
	const wiki = {};
	Prism.languages['wiki'] = wiki;

	// 自定义Wiki语法高亮
	const keyword = 'keyword',
		url = 'url',
		bold = 'bold',
		doctype = 'doctype',
		comment = 'comment',
		tag = 'tag',
		punctuation = 'punctuation',
		variable = 'variable',
		builtin = 'builtin',
		template = theme === 'dark' || theme === 'funky' ? 'builtin' : 'function',
		symbol = 'symbol',
		selector = 'selector',
		string = 'string',
		map: Partial<Record<Types, string>> = {
			'redirect-syntax': keyword,
			'redirect-target': url,
			'link-target': `${url} ${bold}`,
			noinclude: doctype,
			include: doctype,
			comment,
			ext: tag,
			'ext-attr-dirty': comment,
			'ext-attr': punctuation,
			'attr-key': 'attr-name',
			'attr-value': 'attr-value',
			arg: variable,
			'arg-name': variable,
			hidden: comment,
			'magic-word': builtin,
			'magic-word-name': builtin,
			'invoke-function': template,
			'invoke-module': template,
			template,
			'template-name': `${template} ${bold}`,
			parameter: punctuation,
			'parameter-key': variable,
			heading: symbol,
			'heading-title': bold,
			html: tag,
			'html-attr-dirty': comment,
			'html-attr': punctuation,
			table: symbol,
			tr: symbol,
			td: symbol,
			'table-syntax': symbol,
			'table-attr-dirty': comment,
			'table-attr': punctuation,
			'table-inter': 'deleted',
			hr: symbol,
			'double-underscore': 'constant',
			link: url,
			category: url,
			file: url,
			'gallery-image': url,
			'imagemap-image': url,
			'image-parameter': keyword,
			quote: `${symbol} ${bold}`,
			'ext-link': url,
			'ext-link-url': url,
			'free-ext-link': url,
			'magic-link': url,
			list: symbol,
			dd: symbol,
			converter: selector,
			'converter-flags': punctuation,
			'converter-flag': string,
			'converter-rule': punctuation,
			'converter-rule-variant': string,
		};

	/**
	 * 处理代码片段
	 * @param stream 流
	 * @param code 完整代码
	 */
	const getSliceFunc = (stream: (string | Prism.Token)[], code: string) =>
		(type: Types | undefined, parentType: Types | undefined, start: number, end: number): void => {
			const text = code.slice(start, end);
			let t = type ?? parentType!;
			if (parentType === 'image-parameter') {
				t = 'root';
			} else if (type === 'converter' && text === ';') {
				t = 'converter-rule';
			}
			stream.push(t in map ? new Prism.Token(map[t]!, [text]) : text);
		};

	const {tokenize} = Prism;

	Prism.tokenize = (code, grammar): (string | Prism.Token)[] => {
		if (grammar === wiki) {
			const tree = Parser.parse(code).json(),
				stack: [Tree, number][] = [],
				output: (string | Prism.Token)[] = [];
			const slice = getSliceFunc(output, code);
			let cur = tree,
				index = 0,
				last = 0,
				out = false;
			while (last < code.length) {
				const {type, range: [, to], childNodes} = cur,
					parentNode = stack[0]?.[0];
				if (out || !childNodes?.length) {
					const [, i] = stack[0]!;
					if (last < to) {
						slice(type, parentNode!.type, last, to);
						last = to;
					}
					index++;
					if (index === parentNode!.childNodes!.length) {
						cur = parentNode!;
						index = i;
						stack.shift();
						out = true;
					} else {
						cur = parentNode!.childNodes![index]!;
						out = false;
						const {range: [from]} = cur;
						if (last < from) {
							slice(parentNode!.type, stack[1]?.[0].type, last, from);
							last = from;
						}
					}
				} else {
					const child = childNodes[0]!,
						{range: [from]} = child;
					if (last < from) {
						slice(type, parentNode?.type, last, from);
						last = from;
					}
					stack.unshift([cur, index]);
					cur = child;
					index = 0;
				}
			}
			return output;
		}
		return tokenize(code, grammar);
	};
};
export default registerWiki;
