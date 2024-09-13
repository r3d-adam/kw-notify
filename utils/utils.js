const formatPrice = (price, postfix = ' ₽') => {
	if (!price) {
		return 0;
	}
	let r = price.replace(/\.00$/g, '');
	r = [...r].reverse().map((char, i) => (i % 3 === 0 ? `${char} ` : char));
	r = r.reverse().join('').trim() + postfix;
	return r;
};

const compareByDateCreate = (a, b) => {
	if (a.date_create > b.date_create) {
		return -1;
	}
	if (a.date_create < b.date_create) {
		return 1;
	}
	return 0;
};

const compareByDate =
	(datePropName = 'date_create') =>
	(a, b) => {
		if (a[datePropName] > b[datePropName]) {
			return -1;
		}
		if (a[datePropName] < b[datePropName]) {
			return 1;
		}
		return 0;
	};

function getTime() {
	const t = new Date();
	const h = `0${t.getHours()}`.slice(-2);
	const m = `0${t.getMinutes()}`.slice(-2);
	const s = `0${t.getSeconds()}`.slice(-2);

	return `${h}:${m}:${s}`;
}

module.exports = {
	formatPrice,
	compareByDateCreate,
	getTime,
	compareByDate,
};
