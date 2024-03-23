import 'types-mediawiki';
import type {Parser, Config, AST, TokenTypes} from 'wikiparser-node/dist/base';

declare global {
	const Parser: Parser;

	type ParserConfig = Config;
	type Tree = AST;
	type Types = TokenTypes;

	namespace Prism {
		export const theme: string | undefined;
		export const pluginPaths: string[] | undefined;
		export const parserConfig: Config | undefined;

		namespace util {
			/** @ignore */
			function getLanguage(ele: HTMLElement): string;
		}
	}
}
