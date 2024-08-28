// prettier-ignore
/* eslint-disable */
const { shared } = require("./global.js");
const { app, Tray, Menu, BrowserWindow, dialog } = require('electron');
const { ipcRenderer } = require('electron');
const { ipcMain } = require('electron');
const path = require('path');
const notifier = require('node-notifier');
const axios = require('axios');
const _ = require('lodash');
const { parseHTML, jobList } = require('./components/parserHTML.js');
const { saveConfig, loadConfig } = require('./components/config.js');
const { getResourcePath } = require('./components/resourcePath.js');
const {
	setFilterUrlPrompt,
	setUsernamePrompt,
	setCookieValuePrompt,
} = require('./components/userSettings.js');

const fs = require('fs');

const open = require('open');

const extractUrls = require('get-urls');

const REFRESH_INTERVAL = 60 * 1000;

console.log(shared);

const plugins = {};

plugins.open = open;

let tray = null;

global.app = {
	plugins,
	mainWindow: null,
	cookie: '',
	appPath: getResourcePath(''),
	configPath: getResourcePath('extra-resources/config.json'),
	notifySoundFilePath: getResourcePath('extra-resources/sound/notify.mp3'),
	newMessageSoundFilePath: getResourcePath('extra-resources/sound/new_message.mp3'),
};

const init = () => {
	global.app.fileConfig = loadConfig();
};

app.whenReady().then(() => {
	init();

	tray = new Tray(path.join(__dirname, 'favicon.png'));
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show App',
			click() {
				app.mainWindow.show();
			},
		},
		{
			label: 'Set Username',
			click: () => {
				setUsernamePrompt(() => parseHTML(app.mainWindow));
				saveConfig(global.app.fileConfig);
			},
		},
		{
			label: 'Set URL',
			click: () => {
				setFilterUrlPrompt(() => parseHTML(app.mainWindow));
				saveConfig(global.app.fileConfig);
			},
		},
		{
			label: 'Set Cookie',
			click: () => {
				setCookieValuePrompt(() => parseHTML(app.mainWindow));
				saveConfig(global.app.fileConfig);
			},
		},

		{
			label: 'Quit',
			click() {
				app.isQuiting = true;
				app.quit();
			},
		},
	]);

	console.log(path.join(__dirname, 'preload.js'));
	app.mainWindow = new BrowserWindow({
		width: 600,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
			enableRemoteModule: true,
		},
		title: '',
	});

	attachWindowListeners(app.mainWindow);

	app.mainWindow.loadURL(`file://${__dirname}/index.html`);
	app.mainWindow.ipcMain = ipcMain;

	tray.setToolTip('kwork notify');
	tray.setContextMenu(contextMenu);
	attachTrayListeners();

	app.mainWindow.webContents.on('dom-ready', () => {
		if (global.app.fileConfig) {
			parseHTML(app.mainWindow);
		} else {
			const interval = setInterval(() => {
				if (global.app.fileConfig) {
					clearInterval(interval);
					parseHTML(app.mainWindow);
				}
			}, 100);
		}

		setInterval(() => {
			parseHTML(app.mainWindow);
		}, REFRESH_INTERVAL);
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

function attachWindowListeners(win) {
	win.on('minimize', function (event) {
		event.preventDefault();
		win.hide();
	});

	win.on('close', function (event) {
		if (!app.isQuiting) {
			event.preventDefault();
			win.hide();
		}

		return false;
	});
}

function attachTrayListeners() {
	tray.on('click', () => {
		if (app.mainWindow) {
			app.mainWindow.show();
		}
	});
}
