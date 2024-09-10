module.exports = {
	rules: {
		'no-undef': 'warn',
		'computed-property-spacing': ['error', 'never'],
		'array-bracket-spacing': ['error', 'never'],
		'semi': 'off',
		'space-in-parens': 'off',
		'radix': 'off',
		'one-var-declaration-per-line': 'off',
		'space-before-function-paren': [
			'off',
			{
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'never',
			},
		],

		'lines-around-comment': [
			'off',
			{
				allowBlockStart: true,
				beforeLineComment: true,
				allowClassStart: true,
			},
		],

		'no-plusplus': 'off',
		'no-unused-vars': 'off',
		'no-param-reassign': 'off',
		'no-useless-concat': 'off',
		'prefer-regex-literals': 'off',
		'func-names': 'off',
		'template-curly-spacing': 'off',
		'one-var': [
			'off',
			{
				var: 'consecutive',
				let: 'consecutive',
				const: 'consecutive',
			},
		],

		'no-tabs': [
			'off',
			{
				allowIndentationTabs: true,
			},
		],

		'quote-props': ['error', 'consistent-as-needed'],

		'no-use-before-define': [
			'error',
			{
				functions: false,
				classes: false,
			},
		],

		'no-console': 'off',
		'arrow-body-style': 'off',
		'no-trailing-spaces': 'off',
		'no-multiple-empty-lines': 'off',

		'indent': [
			'off',
			4,
			{
				SwitchCase: 1,
			},
		],

		'quotes': 'off',
		'max-len': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'prefer-arrow-callback': 'off',
		'comma-dangle': 'off',
		'operator-linebreak': ['off', 'before'],

		'import/no-extraneous-dependencies': [
			'off',
			{
				devDependencies: true,
			},
		],

		'padded-blocks': 'off',
	},
};
