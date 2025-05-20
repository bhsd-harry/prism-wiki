import * as Parser from 'wikilint';
import registerWiki from '../src/wiki';
import type {Token as PToken, TokenStream} from 'prismjs';

const entities = {'<': '&lt;', '>': '&gt', '&': '&amp;'};

class Token implements Omit<PToken, 'alias' | 'length' | 'greedy'> {
	declare type: string;
	declare content: TokenStream;

	/** @implements */
	constructor(type: string, content: TokenStream) {
		this.type = type;
		this.content = content;
	}

	/** @implements */
	static stringify(this: void, token: TokenStream): string {
		if (typeof token === 'string') {
			return token.replace(/[<>&]/gu, m => entities[m as '<' | '>' | '&']);
		} else if (Array.isArray(token)) {
			return token.map(Token.stringify).join('');
		}
		return `<${token.type}>${Token.stringify(token.content)}</>`;
	}
}

const Prism = {
	languages: {} as Record<string, unknown>,
	tokenize(text: string, _: unknown): TokenStream {
		return text;
	},
	Token,
	hooks: {
		add(): void {
			//
		},
	},
};
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
registerWiki('');

export const parse = (wikitext: string): string => Token.stringify(Prism.tokenize(wikitext, Prism.languages['wiki']));
