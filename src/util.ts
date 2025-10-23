export const jsonTags = new Set(['templatedata', 'maplink', 'mapframe']),
	latexTags = new Set(['math', 'chem', 'ce']),
	basic = [
		'components/prism-core.min.js',
		'plugins/line-numbers/prism-line-numbers.min.js',
		'plugins/autolinker/prism-autolinker.min.js',
	];

/**
 * 生成语言正则表达式
 * @param langs 语言列表
 */
export const getRegex = (langs: Record<string, unknown>): RegExp =>
	new RegExp(String.raw`\blang(?:uage)?-(${Object.keys(langs).join('|')})\b`, 'iu');

/**
 * 获取 jsDelivr 路径
 * @param paths 子路径列表
 */
export const getPath = (paths: string[]): string => `combine/${paths.map(s => `npm/prismjs@1.30.0/${s}`).join()}`;
