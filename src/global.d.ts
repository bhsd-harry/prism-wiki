import type {} from 'types-mediawiki';
import type * as ParserBase from 'wikiparser-node';

declare global {
	const Parser: ParserBase;

	namespace Prism {
		export const theme: string | undefined;
		export const pluginPaths: string[] | undefined;
	}
}
