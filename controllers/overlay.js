'use strict';

const path = require('path');
const {
	app,
	shell,
	globalShortcut,
	ipcMain,
	BrowserWindow,
	Tray,
	nativeImage,
	Menu,
	screen,
} = require('electron');
const logger = require('../utils/logger');

function timeout(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async (eventEmitter) => {
	/**
	 * Window Setup
	 */

	let window, tray;

	async function createWindow() {
		const primaryDisplay = screen.getPrimaryDisplay();
		const { width, height, x, y } = primaryDisplay.workArea;
		const windowWidth = 400;
		const windowHeight = height;

		window = new BrowserWindow({
			width: windowWidth,
			height: windowHeight,
			x: x + width - windowWidth,
			y: y + height - windowHeight,
			frame: false,
			transparent: true,
			alwaysOnTop: true,
			resizable: false,
			skipTaskbar: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		window.setAlwaysOnTop(true, 'screen-saver', 1);

		try {
			await window.loadFile('./views/overlay.html');
		} catch (error) {
			logger.debug(error);
		}

		window.setIgnoreMouseEvents(true, { forward: true });

		if (process.env.NODE_ENV === 'development') {
			window.webContents.openDevTools();
			setDevelopmentKeyBindings();
			window.webContents.openDevTools({ mode: 'detach', activate: false });
		}

		window.once('ready-to-show', () => {
			window.show();
		});
	}

	function setDevelopmentKeyBindings() {
		globalShortcut.register('CmdOrCtrl + H', () => {
			const type = 'error';
			const message = `(Demo) ${new Date().getTime()}`;

			pushWindowOnTop(window);

			window.webContents.send('web-notify', { type, message });
		});

		globalShortcut.register('CmdOrCtrl + J', () => {
			window.webContents.send('web-toggle');
		});
	}

	function pushWindowOnTop(window) {
		if (window) {
			window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
			window.setAlwaysOnTop(true, 'screen-saver');
			window.moveTop?.();

			// Хак: "мигаем" окном, чтобы пересобрать стек окон
			window.hide();
			setTimeout(() => {
				window.showInactive();
			}, 50);
		}
	}

	/**
	 * Event Setup
	 */

	eventEmitter.on('app-notify-success', ({ title, message, options, link }) => {
		const type = 'info';

		pushWindowOnTop(window);

		window.webContents.send('web-notify', { type, title, message, options, link });
	});

	eventEmitter.on('app-notify-error', ({ title, message }) => {
		const type = 'error';

		pushWindowOnTop(window);

		window.webContents.send('web-notify', {
			type,
			message,
			title,
			options: { timeOut: 0, extendedTimeOut: 0 },
		});
	});

	ipcMain.on('web-mouse', (event, isMouseEnter) => {
		if (isMouseEnter) {
			window.setIgnoreMouseEvents(false);
		} else {
			window.setIgnoreMouseEvents(true, { forward: true });
		}
	});

	ipcMain.on('web-empty-notify', (event) => {
		window.setAlwaysOnTop(false);
	});

	app.on('activate', function () {
		// https://www.electronjs.org/docs/tutorial/quick-start#open-a-window-if-none-are-open-macos
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	/*
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  */

	await app.whenReady();

	// https://github.com/electron/electron/issues/16809
	await timeout(process.platform === 'linux' ? 1000 : 0);

	// await createWindow();

	app.whenReady().then(() => {
		createWindow();

		// следим за сменой дисплея
		screen.on('display-metrics-changed', async () => {
			if (window) {
				window.close(); // или можно перетащить
			}
			await createWindow();
			window.webContents.send('web-notify', {
				type: 'success',
				message: 'Primary monitor changed',
			});
		});
	});
};
