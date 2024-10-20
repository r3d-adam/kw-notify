const { compareByDateCreate, compareByDate } = require('../utils/utils');
const { getPageRequestWithCookie, requestWithCookie } = require('./request');
const { StoreObserver } = require('./store-observer');

const BASE_URL = 'https://kwork.ru';

const MAX_ELEMENTS = 100;
let jobList = [];
let isFirstRun = true;

const initialState = {
	html: null,
	isFirstRun: true,
	jobList: [],
	messages: [],
	activeOrdersNewMessageCount: 0,
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
			jobList: [...jobList].sort(compareByDate('date_active')).slice(0, MAX_ELEMENTS),
		};
	},
	setMessages(messages) {
		this.state = {
			...this.state,
			messages,
		};
	},
	setIsLoading(isLoading) {
		this.state.isLoading = isLoading;
	},
	setError(error) {
		this.state.error = error;
	},
	getPage: getPage,
	getMessages: getMessages,
	getActiveOrdersMessages: getActiveOrdersMessages,
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

function getMessages() {
	const { cookie } = global.app.fileConfig;
	storeObserver.setIsLoading(true);
	storeObserver.setState({ requests: ++store.state.requests });
	console.log('setIsLoading(true)');

	const config = {
		method: 'post',
		data: '',
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	};

	return requestWithCookie(`${BASE_URL}/getdialogs`, cookie, config)
		.then((data) => {
			storeObserver.setState({
				messages: data.data.data.rows,
				isLoading: false,
				error: null,
			});
			return data;
		})
		.catch((error) => {
			storeObserver.setState({ ...initialState, error });
			return error;
		});
}

function getActiveOrdersMessages() {
	const { cookie } = global.app.fileConfig;
	storeObserver.setIsLoading(true);
	storeObserver.setState({ requests: ++store.state.requests });

	const config = {
		method: 'get',
	};

	return requestWithCookie(`${BASE_URL}/get_manage_orders?s=active`, cookie, config)
		.then((data) => {
			const newMessageCount = data?.data?.data?.orderListData?.reduce((acc, element) => {
				return (acc += element?.messages);
			}, 0);

			storeObserver.setState({
				activeOrdersNewMessageCount: newMessageCount || 0,
				isLoading: false,
				error: null,
			});
			return newMessageCount;
		})
		.catch((error) => {
			storeObserver.setState({ ...initialState, error });
			return error;
		});
}

module.exports = { store, storeObserver };
