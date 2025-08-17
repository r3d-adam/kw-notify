const axios = require('axios');

const checkResponse = (response) => {
	// console.log('checkResponse response', response);

	if (response.status === 200 && response.data) {
		return Promise.resolve(response);
	}
	return Promise.reject('checkResponse response.ok failed');
};

const getPageRequestWithCookie = async (url, cookie) => {
	// console.log(url, cookie);

	let response;
	try {
		response = await axios.get(url, {
			headers: {
				// Cookie: `slrememberme=${cookie}`,
				Cookie: `RORSSQIHEK=${cookie}`,
			},
			timeout: 30000
		});
		return checkResponse(response);
	} catch (err) {
		return Promise.reject(err.message || err);
	}
};

const requestWithCookie = async (url, cookie, options = { method: 'get', headers: {} }) => {
	let response;
	try {
		response = await axios({
			...options,
			method: options.method,
			url,
			headers: {
				...options.headers,
				Cookie: `RORSSQIHEK=${cookie}`,
			},
		});

		return checkResponse(response);
	} catch (err) {
		logError(err);
		return Promise.reject(err.message || err);
	}
};

module.exports = {
	getPageRequestWithCookie,
	requestWithCookie,
};
