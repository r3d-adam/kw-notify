import globals from 'globals';
import pluginJs from '@eslint/js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// const configNode = require('eslint-config-node');
const myEslintConfig = require('./myEslintConfig.js');

export default [
	{
		files: ['**/*.js'],
		languageOptions: { sourceType: 'commonjs' },
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	pluginJs.configs.recommended,
	myEslintConfig,
];
