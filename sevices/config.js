const fs = require('fs');

const initialState = {
	cookie: '',
	nickname: '',
	filterUrl: 'https://kwork.ru/projects',
};

const loadConfig = () => {
	try {
		const { configPath } = global.app;
		if (fs.existsSync(configPath)) {
			console.log('global.app.configPath', configPath);

			const configData = fs.readFileSync(configPath);
			return JSON.parse(configData);
		} else {
			fs.writeFileSync(configPath, JSON.stringify(initialState, null, 2));
			return initialState;
		}
	} catch (error) {
		console.error('Ошибка при загрузке конфигурации:', error.message);
		return initialState;
	}
};

const saveConfig = (config) => {
	try {
		const configData = JSON.stringify(config, null, 2);
		fs.writeFileSync(global.app.configPath, configData);
		console.log('Конфигурация успешно сохранена.');
	} catch (error) {
		console.error('Ошибка при сохранении конфигурации:', error.message);
	}
};

module.exports = {
	loadConfig,
	saveConfig,
};
