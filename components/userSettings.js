const { saveConfig } = require('./config.js');
const prompt = require('custom-electron-prompt');

const setCookieValuePrompt = (cb) => {
	console.log(global.app.fileConfig.cookie);
	prompt({
		title: 'Set Cookie',
		label: 'Cookie slrememberme:',
		value: global.app.fileConfig.cookie,
		inputAttrs: {
			type: 'text',
		},
		type: 'input',
	})
		.then((r) => {
			if (r === null) {
				console.log('user cancelled');
			} else {
				// console.log('result', r);
				global.app.fileConfig.cookie = r;
				// console.log('result', r);
				saveConfig(global.app.fileConfig);
				// console.log(global.app.fileConfig);
				cb();
			}
		})
		.catch(console.error);
};

const setUsernamePrompt = (cb) => {
	console.log(global.app.fileConfig.nickname);
	prompt({
		title: 'Set username',
		label: 'Username:',
		value: global.app.fileConfig.nickname,
		inputAttrs: {
			type: 'text',
		},
		type: 'input',
	})
		.then((r) => {
			if (r === null) {
				console.log('user cancelled');
			} else {
				global.app.fileConfig.nickname = r;
				saveConfig(global.app.fileConfig);
				cb();
			}
		})
		.catch(console.error);
};

const setFilterUrlPrompt = (cb) => {
	console.log(global.app.fileConfig.filterUrl);
	prompt({
		title: 'Set Filter URL',
		label: 'Filter URL (https://kwork.ru/projects?view=0&...):',
		value: global.app.fileConfig.filterUrl,
		inputAttrs: {
			type: 'text',
		},
		type: 'input',
	})
		.then((r) => {
			if (r === null) {
				console.log('user cancelled');
			} else {
				global.app.fileConfig.filterUrl = r;
				saveConfig(global.app.fileConfig);
				cb();
			}
		})
		.catch(console.error);
};

module.exports = {
	setFilterUrlPrompt,
	setUsernamePrompt,
	setCookieValuePrompt,
};
