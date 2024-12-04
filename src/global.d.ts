import 'types-mediawiki';
import type * as ParserBase from 'wikiparser-node';
import type {AST, TokenTypes, Config} from 'wikiparser-node';

declare global {
	const Parser: ParserBase;

	type Tree = AST;
	type Types = TokenTypes;
	type ParserConfig = Config;

	namespace Prism {
		export const theme: string | undefined;
		export const pluginPaths: string[] | undefined;
	}
}
