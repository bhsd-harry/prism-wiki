import 'types-mediawiki';
import type {Parser, Config} from 'wikiparser-node/base';

declare global {
	const Parser: Parser;

	type ParserConfig = Config;
}
