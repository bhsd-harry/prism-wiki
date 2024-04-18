import 'types-mediawiki';
import type {Parser, AST, TokenTypes, Config} from 'wikiparser-node/base';

declare global {
	const Parser: Parser;

	type Tree = AST;
	type Types = TokenTypes;
	type ParserConfig = Config;

	namespace Prism {
		export const theme: string | undefined;
		export const pluginPaths: string[] | undefined;
	}
}
