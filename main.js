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
const { saveConfig, loadConfig } = require('./sevices/config.js');
const { getResourcePath } = require('./utils/resourcePath.js');
const {
	setFilterUrlPrompt,
	setUsernamePrompt,
	setCookieValuePrompt,
} = require('./sevices/userSettings.js');
const sound = require('sound-play');
// const sound1 = require('play-sound')((opts = { players: ['powershell'], player: 'powershell' }));
const audioPlay = require('audio-play');
const audioLoader = require('audio-loader');
const { Howl } = require('howler');

const fs = require('fs');

const open = require('open');
const { store, storeObserver } = require('./sevices/store.js');
const { compareByDateCreate, getTime, formatPrice } = require('./utils/utils.js');
const Overlay = require('./controllers/overlay');
const EventEmitter = require('events');
const logger = require('./utils/logger.js');
const projectLinkStart = 'https://kwork.ru/projects/';

// const extractUrls = require('get-urls');

/*
 TODO: отправлять запрос на projects с FormData (парсим урл -> вставляем в formData.append* param, value)), а не парсить страницу
 TODO: logging
*/
const REFRESH_INTERVAL = 60 * 1000;

// logger.debug(shared);

const plugins = {};

plugins.open = open;
plugins.logger = logger;

let tray = null;
const eventEmitter = new EventEmitter();

global.app = {
	plugins,
	mainWindow: null,
	cookie: '',
	appPath: getResourcePath(''),
	configPath: getResourcePath('extra-resources/config.json'),
	notifySoundFilePath: getResourcePath('extra-resources/sound/notify.mp3'),
	newMessageSoundFilePath: getResourcePath('extra-resources/sound/new_message.mp3'),
	store,
	storeObserver,
	fileConfig: null,
	newJobNotifyDisabled: false,
	newMessageNotifyDisabled: false,
	mute: false,
};

const init = () => {
	global.app.fileConfig = loadConfig();
};

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
	init();

	try {
		if (!global.app.mute) {
			sound.play(global.app.notifySoundFilePath);
		}
	} catch (error) {
		logger.debug(error);
	}

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
				setUsernamePrompt(() => fetchAndProcessPage());
				saveConfig(global.app.fileConfig);
			},
		},
		{
			label: 'Set URL',
			click: () => {
				setFilterUrlPrompt(() => fetchAndProcessPage());
				saveConfig(global.app.fileConfig);
			},
		},
		{
			label: 'Set Cookie',
			click: () => {
				setCookieValuePrompt(() => fetchAndProcessPage());
				saveConfig(global.app.fileConfig);
			},
		},
		{
			label: 'Hide New Jobs Notify',
			type: 'checkbox',
			checked: false,
			click: (item) => {
				// console.dir(item.checked);
				global.app.newJobNotifyDisabled = item.checked;
			},
		},
		{
			label: 'Hide New Messages',
			type: 'checkbox',
			checked: false,
			click: (item) => {
				// console.dir(item.checked);
				global.app.newMessageNotifyDisabled = item.checked;
			},
		},
		{
			label: 'Mute',
			type: 'checkbox',
			checked: false,
			click: (item) => {
				// console.dir(item.checked);
				global.app.mute = item.checked;
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

	// logger.debug(path.join(__dirname, 'preload.js'));
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

	app.mainWindow.ipcMain = ipcMain;

	tray.setToolTip('kwork notify');
	tray.setContextMenu(contextMenu);
	attachTrayListeners();

	app.mainWindow.webContents.on('dom-ready', mainWindowReady);
	await app.mainWindow.loadURL(`file://${__dirname}/index.html`);

	await Overlay(eventEmitter);
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

function updateAuthStatus(authStatus) {
	authStatus
		? setWindowTitle(app.mainWindow, `Авторизован ${getTime()}`)
		: setWindowTitle(app.mainWindow, `НЕ АВТОРИЗОВАН !!! ${getTime()}`);
}

function setWindowTitle(win, title) {
	if (win) {
		win.webContents.send('changeTitle', title);
	}
}

function checkUnreadMsg(count) {
	if (!count) {
		return false;
	}
	const { newMessageSoundFilePath } = global.app.newMessageSoundFilePath;
	if (!global.app.newMessageNotifyDisabled && !global.app.mute) {
		sound
			.play(newMessageSoundFilePath)
			.then((response) => logger.debug('newMessageSound done'))
			.catch((e) => logger.debug(e));

		eventEmitter.emit('app-notify-success', {
			title: `НОВЫЕ СООБЩЕНИЯ`,
			message: `${parseInt(count, 10)}`,
		});
	}
	return true;
}

function updateJobList(jobList) {
	let isListChanged = 0;
	const { isFirstRun } = store.state;
	const newJobs = [];
	const { jobList: storeJobList } = store.state;
	let shouldPlaySound = false;
	let i = 0;

	jobList.forEach((newElement) => {
		const isNew = !_.some(
			storeJobList,
			(element) =>
				element.priceLimit === newElement.priceLimit &&
				element.id === newElement.id &&
				element.description === newElement.description,
		);
		const dateDiffH = (new Date() - new Date(newElement.date_active)) / 1000 / 60 / 60;
		if (isNew) {
			isListChanged++;
			if (!newElement.url) {
				newElement.url = `/projects/${newElement.id}`;
			}
			newJobs.push(newElement);
			// store.setState({ jobList: [newElement, ...store.jobList] });

			// if (dateDiffH < 1  && !global.app.newJobNotifyDisabled) {
			if (dateDiffH < 1 && !isFirstRun && !global.app.newJobNotifyDisabled) {
				shouldPlaySound = true;

				setTimeout(() => {
					eventEmitter.emit('app-notify-success', {
						title: `${newElement.name.slice(0, 40)} - ${formatPrice(
							newElement.priceLimit,
						)}`,
						message: `${newElement.description}`,
						link: projectLinkStart + newElement.id,
					});
				}, i * 5000);

				i++;
			}
		}
	});

	if (isListChanged) {
		const { notifySoundFilePath } = global.app;
		store.setJobList([...newJobs, ...storeJobList]);
		logger.debug(store.state.jobList);

		// logger.debug('notifySoundFilePath', notifySoundFilePath);

		// if (!isFirstRun) {
		if (shouldPlaySound && !global.app.mute) {
			try {
				sound.play(notifySoundFilePath);
			} catch (error) {
				logger.debug(error);
			}
		}
		// }
		// logger.debug(jobList);

		app.mainWindow.webContents.send('showList', store.state.jobList);
	}

	if (isFirstRun) {
		store.state.isFirstRun = false;
	}
}

function fetchAndProcessPage() {
	if (global.app.fileConfig) {
		// const {url, cookie} = global.app.fileConfig;
		storeObserver
			.getPage()
			.then((data) => {
				logger.debug('fetchAndProcessPage data', data);

				if (!store.state.error) {
					// logger.debug('fetchAndProcessPage store', store);

					const parsedData = parseHTML(store.state.html);
					if (parsedData) {
						// store.setState({ jobList: parsedData.jobList });
						updateAuthStatus(parsedData.auth);
						// checkUnreadMsg(parsedData.unreadMessageCount);
						updateJobList(parsedData.jobList);
					}
				} else {
					throw new Error(store.state.error);
				}
			})
			.catch((err) => {
				logger.debug(err);
			});

		if (!global.app.newMessageNotifyDisabled) {
			const getMessages = storeObserver.getMessages();

			const getActiveOrdersMessages = storeObserver.getActiveOrdersMessages();

			Promise.all([getMessages, getActiveOrdersMessages]).then((values) => {
				const unread = store.state.messages.filter((message) => message.unread_count > 0);
				const activeOrdersMessageCount = store.state.activeOrdersNewMessageCount;
				const totalNewMessageCount = unread.length + activeOrdersMessageCount;

				if (totalNewMessageCount > 0 && !global.app.newMessageNotifyDisabled) {
					const { newMessageSoundFilePath } = global.app;

					try {
						if (!global.app.mute) {
							sound
								.play(newMessageSoundFilePath)
								.then(() => logger.debug('newMessageSound done'));

							eventEmitter.emit('app-notify-success', {
								title: `НОВЫЕ СООБЩЕНИЯ`,
								message: `${totalNewMessageCount}`,
							});
						}
					} catch (error) {
						logger.debug(error);
					}
					for (const message of unread) {
						const lastMessage = message?.lastMessage?.message;
						const { username } = message;
						if (lastMessage) {
							eventEmitter.emit('app-notify-success', {
								title: username,
								message: lastMessage,
							});
						}
					}
				}
			});
		}
	}
}

function mainWindowReady() {
	logger.debug('mainWindowReady');

	storeObserver.listen((store) => {
		const { isLoading, error, requests } = store.state;
		logger.debug('store listener', isLoading, ` requests ${requests}`);

		if (app.mainWindow) {
			if (error) {
				app.mainWindow.webContents.send('getPageRequestError', error);
			}
			if (isLoading) {
				app.mainWindow.webContents.send('getPageRequestLoading');
			} else {
				app.mainWindow.webContents.send('getPageRequestLoaded');
			}
		}
	});

	if (global.app.fileConfig) {
		fetchAndProcessPage();
	} else {
		const interval = setInterval(() => {
			if (global.app.fileConfig) {
				clearInterval(interval);
				fetchAndProcessPage();
			}
		}, 100);
	}

	setInterval(() => {
		fetchAndProcessPage();
	}, REFRESH_INTERVAL);
}
