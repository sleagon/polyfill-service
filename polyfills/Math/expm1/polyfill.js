// 20.2.2.15. Math.expm1 ( x )
CreateMethodProperty(Math, 'expm1', function expm1(x) {
	// If x is NaN, the result is NaN.
	if (isNaN(x)) {
		return NaN;
	}
	// If x is +0, the result is +0.
	if (x === 0 && 1/x === Infinity) {
		return 0;
	}
	// If x is -0, the result is -0.
	if (x === 0 && 1/x === -Infinity) {
		return -0;
	}
	// If x is +∞, the result is +∞.
	if (x === Infinity) {
		return Infinity;
	}
	// If x is -∞, the result is -1.
	if (x === -Infinity) {
		return -1;
	}
	return Math.exp(x) - 1;
});
