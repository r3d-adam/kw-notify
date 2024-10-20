class StoreObserver {
	listeners = new Set();

	constructor(store) {
		this.store = store;
	}

	listen(listener) {
		this.listeners.add(listener);
	}

	unsubscribe(listener) {
		this.listeners.remove(listener);
	}

	setState(state) {
		if (Object.hasOwn(this.store, 'setState') && typeof this.store.setState === 'function') {
			this.store.setState(state);
			this.listeners.forEach((listener) => listener(this.store));
		}
	}

	setIsLoading(isLoading) {
		if (
			Object.hasOwn(this.store, 'setIsLoading') &&
			typeof this.store.setIsLoading === 'function'
		) {
			this.store.setIsLoading(isLoading);
			this.listeners.forEach((listener) => listener(this.store));
		}
	}

	async getPage() {
		if (Object.hasOwn(this.store, 'getPage') && typeof this.store.getPage === 'function') {
			try {
				const result = await this.store.getPage();
				console.log('StoreObserver getPage');

				this.listeners.forEach((listener) => listener(this.store));
				return result;
			} catch (error) {
				return Promise.reject(error instanceof Error ? error.message : error);
			}
		}
		return Promise.reject('StoreObserver getPage error');
	}
	async getMessages() {
		if ('getPage' in this.store && typeof this.store.getPage === 'function') {
			try {
				const result = await this.store.getMessages();
				console.log('StoreObserver getMessages');

				this.listeners.forEach((listener) => listener(this.store));
				return result;
			} catch (error) {
				return Promise.reject(error instanceof Error ? error.message : error);
			}
		}
		return Promise.reject('StoreObserver getMessages error');
	}
	async getActiveOrdersMessages(){
		if ('getActiveOrdersMessages' in this.store && typeof this.store.getPage === 'function') {
			try {
				const result = await this.store.getActiveOrdersMessages();
				console.log('StoreObserver getActiveOrdersMessages');

				this.listeners.forEach((listener) => listener(this.store));
				return result;
			} catch (error) {
				return Promise.reject(error instanceof Error ? error.message : error);
			}
		}
		return Promise.reject('StoreObserver getMessages error');
	}
}

module.exports = { StoreObserver };
