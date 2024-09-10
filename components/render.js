const { ipcRenderer, remote } = require('electron');

const fs = require('fs');
const path = require('path');

const open = require('open');
const extractUrls = require('get-urls');

const listItemTemplatePath = path.join(__dirname, './html/listItem.html');
const listItemTemplate = fs.readFileSync(listItemTemplatePath, 'utf8');
const projectLinkStart = 'https://kwork.ru/projects/';

const { formatPrice } = window.utils;

// ipcRenderer.invoke('getPlugins', '').then((result) => {
// 	// ...
// 	console.log(result);
// });

ipcRenderer.on('sendSettings', (event, list) => {
	console.log('sendSettings');
	console.log(list);
});

ipcRenderer.on('changeTitle', (event, newTitle) => {
	document.title = newTitle;
});

// ipcRenderer.on('showList', (win, jobList) => {
ipcRenderer.on('showList', async (event, list) => {
	console.log('RENDER');
	// console.log(list);
	// document.title = `RENDER ${list.length}`;

	const listElement = document.querySelector('.job-list');

	if (list && list.length) {
		const listHTML = list
			.map((item, i) => {
				const time = item?.date_create.replace(/\d+-\d+-\d+ /, '') || 0;
				let { description = '' } = item;
				let urls = [];

				urls = extractUrls(description);

				// document.title = `urls ${urls.length}`;
				[...urls].forEach((value) => {
					console.log(value);
					description = description.replace(
						value,
						`<a href="#" data-link="${value}" class="desc-link link">
							${value}
				 		</a>`,
					);
				});

				// document.title = `item ${i}`;

				const newItem = listItemTemplate
					.replaceAll('{{name}}', item.name)
					.replaceAll('{{price}}', formatPrice(item.priceLimit))
					.replaceAll('{{description}}', description)
					.replaceAll('{{time}}', time)
					.replaceAll('{{url}}', `${projectLinkStart + item.id}`);

				return newItem;
			})
			.join('');

		// document.title = `listHTML ${listHTML.length}`;
		listElement.innerHTML = listHTML;
	}
});

const clickHandler = (e) => {
	if (e.target && (e.target.closest('.link-to-project') || e.target.closest('.desc-link'))) {
		e.preventDefault();
		// console.log('НАЖАЛИ link-to-project || desc-link');

		let options = {};
		if (e.target.closest('.desc-link')) {
			options = {
				app: {
					name: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
					arguments: ['--incognito'],
				},
			};
		}

		const link = e.target.getAttribute('data-link');
		open(link, options);
	}
};

document.addEventListener('click', clickHandler);

document.addEventListener('auxclick', clickHandler);

document.addEventListener('click', (e) => {
	if (e.target && e.target.closest('.test-link')) {
		e.preventDefault();

		// console.log('НАЖАЛИ test-link');

		const link = e.target.getAttribute('data-link');
		open(link);
	}
});

function htmlToElement(html) {
	const template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}
