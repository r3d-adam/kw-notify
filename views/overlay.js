const { ipcRenderer } = require('electron');

const toastr = require('toastr');
const open = require('open');

// toast options

toastr.options = {
	closeButton: true,
	debug: false,
	newestOnTop: true,
	progressBar: true,
	positionClass: 'toast-bottom-right',
	preventDuplicates: false,
	showDuration: 100,
	hideDuration: 100,
	timeOut: 20000,
	extendedTimeOut: 5000,
	showEasing: 'swing',
	hideEasing: 'swing',
	showMethod: 'fadeIn',
	hideMethod: 'fadeOut',
	onCloseClick: (event) => {
		ipcRenderer.send('web-mouse', false);
	},
	onHidden: (event) => {
		const container = document.querySelector('#toast-container');
		console.log(container?.children.length);
		
		if (!container?.children.length) {
			ipcRenderer.send('web-empty-notify');
		}
	}
};

// web event handling

ipcRenderer.on('web-notify', (event, { type, message, link, options, title }) => {
	if (link) {
		options = {
			...options,
			onclick: () => open(link),
		};
	}

	const element = toastr[type](message, title || '', options);
	if (element) {
		element
			.on('mouseenter', () => ipcRenderer.send('web-mouse', true))
			.on('mouseleave', () => ipcRenderer.send('web-mouse', false));
	}
});

ipcRenderer.on('web-toggle', (event) => {
	const borderDiv = document.getElementById('div-border');
	const devDiv = document.getElementById('div-dev');

	if (borderDiv.style.display) {
		borderDiv.style.display = null;
		devDiv.style.display = null;
	} else {
		borderDiv.style.display = 'none';
		devDiv.style.display = 'none';
	}
});
