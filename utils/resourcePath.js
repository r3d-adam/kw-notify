const { app } = require('electron');
const path = require('path');

const getResourcePath = (subPath) => {
	// запущено ли приложение в собранном виде
	if (app && app?.isPackaged) {
		return path.join(process.resourcesPath, subPath);
	} else {
		return path.join(path.dirname(__dirname), subPath);
	}
};

module.exports = {
	getResourcePath,
};
