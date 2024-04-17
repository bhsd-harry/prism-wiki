import 'types-mediawiki';
import type {Parser, AST, TokenTypes} from 'wikiparser-node/dist/base';

declare global {
	const Parser: Parser;

	type Tree = AST;
	type Types = TokenTypes;

	namespace Prism {
		export const theme: string | undefined;
		export const pluginPaths: string[] | undefined;
	}
}
