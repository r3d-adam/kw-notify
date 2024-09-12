/* eslint-disable */
const notifier = require('node-notifier');
const axios = require('axios');
const _ = require('lodash');
const { ipcRenderer, dialog } = require('electron');
const open = require('open');
const cheerio = require('cheerio');
// prettier-ignore

const sound = require('sound-play');

// // хак на импорт новых модулей не поддерживающих require, использовать дефолтный экспорт через module.default(); ( т.е. plugins.open.default()  )
// const plugins = {};
// (async () => {
// 	/* eslint-disable */
// 	const open = await import('open');
// 	/* eslint-enable  */
// 	plugins.open = open;
// })();

// const cookie =
// 	'slrememberme=..............................................................; ';

const MAX_ELEMENTS = 100;
let jobList = [];
let isFirstRun = true;

const parseHTML = (win) => {
	if (!app.fileConfig) {
		// console.log(app);
		console.log('config is not loaded');
		return null;
	}
	// .dropdownbox__username
	const { nickname } = app.fileConfig;
	const url = app.fileConfig.filterUrl; // 'https://kwork.ru/projects?view=0&kworks-filters%5B%5D=0&kworks-filters%5B%5D=1&a=1';

	const notifySoundFilePath = app.notifySoundFilePath;

	// sound.play(`${notifySoundFilePath}`);
	// console.log('app.store.state.html', app.store.state.html);

	const html = app.store.state.html.data;
	const result = {
		auth: null,
		unreadMessageCount: 0,
		jobList: [],
	};

	if (nickname.trim() && html.indexOf(nickname) >= 0) {
		// win.webContents.send('changeTitle', 'Авторизован');
		result.auth = true;
	} else {
		// win.webContents.send('changeTitle', 'НЕ АВТОРИЗОВАН !!!');
		result.auth = false;
	}

	result.unreadMessageCount = checkUnreadMessagesCounter(html);
	result.jobList = getJobs(html);

	return result;
};

// const parseHTML = async (win) => {
// 	if (!app.fileConfig) {
// 		console.log(app);

// 		console.log('config is not loaded');

// 		return;
// 	}
// 	// .dropdownbox__username
// 	const { nickname } = app.fileConfig;
// 	const url = app.fileConfig.filterUrl; // 'https://kwork.ru/projects?view=0&kworks-filters%5B%5D=0&kworks-filters%5B%5D=1&a=1';

// 	const notifySoundFilePath = app.notifySoundFilePath;

// 	// sound.play(`${notifySoundFilePath}`);

// 	try {
// 		const response = await axios.get(url, {
// 			headers: {
// 				Cookie: `slrememberme=${app.fileConfig.cookie}`,
// 			},
// 		});

// 		const html = response.data;
// 		if (nickname.trim() && html.indexOf(nickname) >= 0) {
// 			win.webContents.send('changeTitle', 'Авторизован');
// 		} else {
// 			win.webContents.send('changeTitle', 'НЕ АВТОРИЗОВАН !!!');
// 		}
// 		checkUnreadMessagesCounter(html);
// 		const currentJobs = getJobs(html);

// 		let isListChanged = 0;

// 		currentJobs.forEach((newElement) => {
// 			const isNew = !_.some(
// 				jobList,
// 				(element) =>
// 					element.priceLimit === newElement.priceLimit &&
// 					element.id === newElement.id &&
// 					element.description === newElement.description,
// 			);

// 			const dateDiffH = (new Date() - new Date(newElement.date_create)) / 1000 / 60 / 60;

// 			if (isNew && (dateDiffH < 1 || isFirstRun)) {
// 				isListChanged++;
// 				if (!newElement.url) {
// 					newElement.url = `/projects/${newElement.id}`;
// 				}

// 				jobList.unshift(newElement);

// 				if (!isFirstRun) {
// 					notifier.notify({
// 						title: `${newElement.name} - ${newElement.priceLimit}`,
// 						message: `${newElement.description}                     #${newElement.id}`,
// 					});
// 				}
// 			}
// 		});

// 		/* -------------------------------- SHOW LOG -------------------------------- */
// 		// console.log(
// 		// 	`currentJobs.length: ${
// 		// 		currentJobs.length
// 		// 	}, new elements: ${isListChanged} ${getTime()}`,
// 		// );
// 		/* -------------------------------------------------------------------------- */

// 		if (isListChanged) {
// 			jobList.sort(compareByDateCreate);

// 			if (jobList.length > MAX_ELEMENTS) {
// 				jobList = jobList.slice(0, 50);
// 			}

// 			// if (!isFirstRun) {
// 			sound.play(`${notifySoundFilePath}`);
// 			// }
// 			console.log(jobList);

// 			win.webContents.send('showList', jobList);
// 		}
// 	} catch (error) {
// 		console.error('Ошибка:', error.message);
// 	}

// 	isFirstRun = false;
// };

notifier.on('click', (notifierObject, options, event) => {
	const message = options.m;
	const id = message.match(/#(\d+)/);

	if (id) {
		open(`https://kwork.ru/projects/${id[1]}`);
	}
});

function getJobs(html) {
	// parse json from html
	const mainDataPos = html.indexOf('window.stateData');
	const bodyPos = html.indexOf('<body');
	let tmpStr = html.slice(mainDataPos, bodyPos);

	const wantsPos = tmpStr.indexOf('"wants":');

	tmpStr = tmpStr.slice(wantsPos);

	const endOfScriptPos = tmpStr.indexOf(';</script>');
	tmpStr = tmpStr.slice(0, endOfScriptPos);
	tmpStr = tmpStr.slice(0, tmpStr.length - 1);
	tmpStr = `{${tmpStr}`;
	tmpStr = tmpStr.replace(/(wants_\d+_data.+?].*}).*/g, '$1');
	tmpStr = tmpStr.replace(/\\"/g, '\\"');
	tmpStr = tmpStr.replace(/\}\}\]\}\}.*/g, '}}]}}');
	// console.log(tmpStr);

	try {
		const jobs = JSON.parse(tmpStr);
		const jobsArray = jobs.wants;

		return jobsArray;
	} catch (error) {
		console.log(error);
		return [];
	}

	// const reversedJobsArray = jobsArray.reverse();
}

function compareByDateCreate(a, b) {
	if (a.date_create > b.date_create) {
		return -1;
	}
	if (a.date_create < b.date_create) {
		return 1;
	}
	return 0;
}

function checkUnreadMessagesCounter(html) {
	const newMessageSoundFilePath = app.newMessageSoundFilePath;
	const $ = cheerio.load(html);
	const msgsCounterElement = $('.message-counter');
	const l = msgsCounterElement.length;
	const k = l ? msgsCounterElement.eq(0).text() : 0;

	if (k) {
		// sound.play(`${newMessageSoundFilePath}`).then((response) => console.log('done'));
		// notifier.notify({
		// 	title: `НОВЫЕ СООБЩЕНИЯ`,
		// 	message: `${parseInt(k, 10)}`,
		// });
	}

	return k;
}

module.exports = {
	parseHTML,
	jobList,
};
