/* eslint-env mocha */
/* globals proclaim */

proclaim.arity = function (fn, expected) {
	this.isFunction(fn);
	this.strictEqual(fn.length, expected);
};
proclaim.name = function (fn, expected) {
	var functionsHaveNames = (function foo() { }).name === 'foo';
	if (functionsHaveNames) {
		this.strictEqual(fn.name, expected);
	} else {
		this.equal(Function.prototype.toString.call(fn).match(/function\s*([^\s]*)\s*\(/)[1], expected);
	}
};
proclaim.nonEnumerable = function (obj, prop) {
	var arePropertyDescriptorsSupported = function () {
		var obj = {};
		try {
			Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
					/* eslint-disable no-unused-vars, no-restricted-syntax */
					for (var _ in obj) { return false; }
					/* eslint-enable no-unused-vars, no-restricted-syntax */
			return obj.x === obj;
		} catch (e) { // this is IE 8.
			return false;
		}
	};
	if (Object.defineProperty && arePropertyDescriptorsSupported()) {
		this.isFalse(Object.prototype.propertyIsEnumerable.call(obj[prop]));
	}
};
it('is a function', function () {
	proclaim.isFunction(Promise.prototype['finally']);
});

it('has correct arity', function () {
	proclaim.arity(Promise.prototype['finally'].length, 1);
});

it('has correct name', function() {
	proclaim.name(Promise.prototype['finally'], 'finally');
});

it('is not enumerable', function () {
	proclaim.nonEnumerable(Promise.prototype, 'finally');
});

describe('finally', function () {
	it("does not take any arguments", function () {
		return Promise.resolve("ok")['finally'](function (val) {
			proclaim.equal(val, undefined);
		});
	});

	it("can throw errors and be caught", function () {
		return Promise.resolve("ok")['finally'](function () {
			throw "error";
		})['catch'](function (e) {
			proclaim.equal(e, 'error');
		});
	});

	it("resolves with resolution value if finally method doesn't throw", function () {
		return Promise.resolve("ok")['finally'](function () {
		}).then(function (val) {
			proclaim.equal(val, 'ok');
		});
	});

	it("rejects with rejection value if finally method doesn't throw", function () {
		return Promise.reject("error")['finally'](function () {
		})['catch'](function (val) {
			proclaim.equal(val, 'error');
		});
	});

	it('Promise#finally, resolved', function () {
		var called = 0;
		var arg = void 8;
		return Promise.resolve(42)['finally'](function (it) {
			called++;
			arg = it;
		}).then(function (it) {
			proclaim.strictEqual(it, 42, 'resolved with a correct value');
			proclaim.strictEqual(called, 1, 'onFinally function called one time');
			proclaim.strictEqual(arg, void 8, 'onFinally function called with a correct argument');
		});
	});
	it('Promise#finally, rejected', function () {
		var called = 0;
		var arg = void 8;
		return Promise.reject(42)['finally'](function (it) {
			called++;
			arg = it;
		})['catch'](function () {
			proclaim.strictEqual(called, 1, 'onFinally function called one time');
			proclaim.strictEqual(arg, void 8, 'onFinally function called with a correct argument');
		});
	});
});

// These tests are taken from https://github.com/tc39/proposal-promise-finally/blob/master/test/test.js
// Licensed under MIT
var someRejectionReason = { message: 'some rejection reason' };
var anotherReason = { message: 'another rejection reason' };

describe('onFinally', function() {
	describe('no callback', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally']()
				.then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(someRejectionReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})
				['finally']()
				.then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					proclaim.strictEqual(reason, someRejectionReason);
				});
		});
	});

	describe('throws an exception', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					proclaim.strictEqual(reason, someRejectionReason);
				});
		});

		specify('from rejected', function() {
			return Promise.reject(anotherReason)['finally'](function onFinally() {
				proclaim.ok(arguments.length === 0);
				throw someRejectionReason;
			}).then(function onFulfilled() {
				throw new Error('should not be called');
			}, function onRejected(reason) {
				proclaim.strictEqual(reason, someRejectionReason);
			});
		});
	});

	describe('returns a non-promise', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return 4;
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(anotherReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, anotherReason);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns a pending-forever promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new Promise(function() {}); // forever pending
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(someRejectionReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new Promise(function() {}); // forever pending
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});
	});

	describe('returns an immediately-fulfilled promise', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.resolve(4);
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(someRejectionReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.resolve(4);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns an immediately-rejected promise', function() {
		specify('from resolved ', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.reject(4);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, 4);
				});
		});

		specify('from rejected', function() {
      		var newReason = {};
			return Promise.reject(someRejectionReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.reject(newReason);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, newReason);
				});
		});
	});

	describe('returns a fulfilled-after-a-second promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve) {
						setTimeout(function() { return resolve(4);}, 1e3);
					});
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(3)
				['catch'](function(e) {
					proclaim.strictEqual(e, 3);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve) {
						setTimeout(function() { return resolve(4);}, 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, 3);
				});
		});
	});

	describe('returns a rejected-after-a-second promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve, reject) {
						setTimeout(function() { return reject(4);}, 1e3);
					});
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(someRejectionReason)
				['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})
				['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve, reject) {
						setTimeout(function() { return reject(anotherReason);}, 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, anotherReason);
				});
		});
	});
});
