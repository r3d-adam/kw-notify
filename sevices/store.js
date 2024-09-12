const { compareByDateCreate } = require('../utils/utils');
const { getPageRequestWithCookie } = require('./request');
const { StoreObserver } = require('./store-observer');

const MAX_ELEMENTS = 100;
let jobList = [];
let isFirstRun = true;

const initialState = {
	html: null,
	isFirstRun: true,
	jobList: [],
	isLoading: false,
	error: null,
	requests: 0,
};

const store = {
	state: initialState,

	setState(state) {
		this.state = {
			...this.state,
			...state,
		};
	},
	setJobList(jobList) {
		this.state = {
			...this.state,
			jobList: [...jobList].sort(compareByDateCreate).slice(0, MAX_ELEMENTS),
		};
	},
	setIsLoading(isLoading) {
		this.state.isLoading = isLoading;
	},
	setError(error) {
		this.state.error = error;
	},
	getPage: getPage,
	// const { filterUrl, cookie } = global.app.fileConfig;
	// this.setIsLoading(true);
	// this.setState({ requests: ++this.state.requests });
	// console.log('setIsLoading(true)');

	// const response = await getPageRequestWithCookie(filterUrl, cookie)
	// 	.then((html) => {
	// 		// console.log('store getPage, ', html);
	// 		this.setState({ html, isLoading: false, error: null });
	// 		return Promise.resolve(html);
	// 	})
	// 	.catch((error) => {
	// 		console.log('store getPage error', error);
	// 		this.setState({ ...initialState, error });
	// 		return Promise.reject(error);
	// 	});
};

const storeObserver = new StoreObserver(store);

async function getPage() {
	const { filterUrl, cookie } = global.app.fileConfig;
	storeObserver.setIsLoading(true);
	storeObserver.setState({ requests: ++store.state.requests });
	console.log('setIsLoading(true)');

	const response = await getPageRequestWithCookie(filterUrl, cookie)
		.then((html) => {
			// console.log('store getPage, ', html);
			storeObserver.setState({ html, isLoading: false, error: null });
			return Promise.resolve(html);
		})
		.catch((error) => {
			console.log('store getPage error', error);
			storeObserver.setState({ ...initialState, error });
			return Promise.reject(error);
		});
}

module.exports = { store, storeObserver };
