import config, {browser, getOxlintConfig} from '@bhsd/code-standard';

const oxlintConfig = getOxlintConfig([
	...config,
	browser,
]);

export default oxlintConfig;
