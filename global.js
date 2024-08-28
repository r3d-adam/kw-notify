global.shared = {
	targetLanguage: 'eng',
};

// хак на импорт новых модулей не поддерживающих require, использовать дефолтный экспорт через module.default(); ( т.е. plugins.open.default()  )
const plugins = {};
(async () => {
	// prettier-ignore
	/* eslint-disable */
	const open = await import('open');
	plugins.open = open;
	/* eslint-enable */
	// prettier-ignore-end

	const shared = {
		plugins,
	};

	module.exports = { shared };
})();
