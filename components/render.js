const { ipcRenderer, remote } = require('electron');

const fs = require('fs');
const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const open = require('open');

// eslint-disable-next-line import/no-extraneous-dependencies
const extractUrls = require('get-urls');

const listItemTemplatePath = path.join(__dirname, './html/listItem.html');
const listItemTemplate = fs.readFileSync(listItemTemplatePath, 'utf8');
const projectLinkStart = 'https://kwork.ru/projects/';

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
ipcRenderer.on('showList', (event, list) => {
	console.log('RENDER');

	if (list && list.length) {
		const listHTML = list
			.map((item) => {
				const time = item.date_create.replace(/\d+-\d+-\d+ /, '');
				const urls = extractUrls(item.description);
				let { description } = item;

				urls.forEach((value) => {
					console.log(value);
					description = description.replace(
						value,
						`<a href="#" data-link="${value}" class="desc-link link-primary">
							${value}
				 		</a>`,
					);
				});

				const newItem = listItemTemplate
					.replaceAll('{{name}}', item.name)
					.replaceAll('{{price}}', item.priceLimit)
					.replaceAll('{{description}}', description)
					.replaceAll('{{time}}', time)
					.replaceAll('{{url}}', `${projectLinkStart + item.id}`);

				return newItem;
			})
			.join('');

		const listElement = document.querySelector('.job-list');
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
