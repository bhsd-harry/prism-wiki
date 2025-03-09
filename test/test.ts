/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from 'fs';
import * as assert from 'assert';
import * as Parser from 'wikiparser-node';
import registerWiki from '../src/wiki';
import parserTests = require('wikiparser-node/test/parserTests.json');
// @ts-expect-error JSON import
import testResults = require('../../parserTests.json');
import type {Token as PToken, TokenStream} from 'prismjs';

declare interface Test {
	desc: string;
	wikitext?: string;
	parsed?: string;
	html?: string;
	print?: string;
	render?: string;
}
declare type TestResult = Pick<Test, 'desc' | 'wikitext' | 'parsed'>;

const split = (test?: TestResult): string[] | undefined =>
	// eslint-disable-next-line es-x/no-regexp-lookbehind-assertions
	test?.parsed?.split(/(?<=<\/>)(?!$)|(?<!^)(?=<\w)/u);

const tests: Test[] = parserTests,
	results: TestResult[] = testResults;
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

describe('Parser tests', () => {
	for (let i = tests.length - 1; i >= 0; i--) {
		const test = tests[i]!,
			{wikitext, desc} = test;
		if (wikitext) {
			it(desc, () => { // eslint-disable-line @typescript-eslint/no-loop-func
				try {
					delete test.html;
					delete test.print;
					delete test.render;
					test.parsed = Token.stringify(Prism.tokenize(wikitext, Prism.languages['wiki']));
					assert.deepStrictEqual(split(test), split(results.find(({desc: d}) => d === desc)));
				} catch (e) {
					if (!(e instanceof assert.AssertionError)) {
						tests.splice(i, 1);
					}
					if (e instanceof Error) {
						Object.assign(e, {cause: {message: `\n${wikitext}`}});
					}
					throw e;
				}
			});
		}
	}
	after(() => {
		fs.writeFileSync(
			'test/parserTests.json',
			`${JSON.stringify(tests, null, '\t')}\n`,
		);
	});
});
