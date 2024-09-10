const formatPrice = (price, postfix = ' ₽') => {
	if (!price) {
		return 0;
	}
	let r = price.replace(/\.00$/g, '');
	r = [...r].reverse().map((char, i) => (i % 3 === 0 ? `${char} ` : char));
	r = r.reverse().join('').trim() + postfix;
	return r;
};

module.exports = {
	formatPrice,
};
