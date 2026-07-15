/* eslint-disable unicorn/no-top-level-side-effects */
import Parser from 'wikilint';
import registerWiki from 'prism-wiki';
import type * as PrismJS from 'prismjs';

const entities = {'<': '&lt;', '>': '&gt', '&': '&amp;'};

class Token implements Omit<PrismJS.Token, 'alias' | 'length' | 'greedy'> {
	declare type: string;
	declare content: PrismJS.TokenStream;

	/** @implements */
	constructor(type: string, content: PrismJS.TokenStream) {
		this.type = type;
		this.content = content;
	}

	/** @implements */
	static stringify(token: PrismJS.TokenStream): string {
		if (typeof token === 'string') {
			return token.replaceAll(/[<>&]/gu, m => entities[m as '<' | '>' | '&']);
		} else if (Array.isArray(token)) {
			return token.map(s => this.stringify(s)).join('');
		}
		return `<${token.type}>${this.stringify(token.content)}</>`;
	}
}

const Prism = {
	languages: {} as Record<string, unknown>,
	tokenize(text: string, _: unknown): PrismJS.TokenStream {
		return text;
	},
	Token,
	hooks: {
		add(): void {
			//
		},
	},
} as unknown as typeof PrismJS;
Object.assign(globalThis, {
	Parser,
	Prism,
	mw: {
		loader: {
			load(): void {
				//
			},
		},
	},
});
registerWiki(Prism, Parser);

export const parse = (wikitext: string): string => Token.stringify(Prism.tokenize(wikitext, Prism.languages['wiki']!));
