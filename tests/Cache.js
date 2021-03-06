define([
	'intern!object',
	'intern/chai!assert',
	'dojo/Deferred',
	'dojo/json',
	'dojo/_base/declare',
	'dstore/Store',
	'dstore/Memory',
	'dstore/Request',
	'./mockRequest',
	'dstore/Cache'
], function (registerSuite, assert, Deferred, JSON, declare, Store, Memory, Request, mockRequest, Cache) {

	/* jshint newcap: false */
	var cachingStore = new Memory();
	var masterFilterCalled;
	var MasterStore = declare([Memory], {
		filter: function () {
			masterFilterCalled = true;
			return this.inherited(arguments);
		}
	});
	var store = new declare([MasterStore, Cache])({
		cachingStore: cachingStore,
		data: [
			{id: 1, name: 'one', prime: false},
			{id: 2, name: 'two', even: true, prime: true},
			{id: 3, name: 'three', prime: true},
			{id: 4, name: 'four', even: true, prime: false},
			{id: 5, name: 'five', prime: true}
		]
	});

	registerSuite({
		name: 'dstore Cache',

		'get': function () {
			assert.strictEqual(store.get(1).name, 'one');
			assert.strictEqual(cachingStore.get(1).name, 'one'); // second one should be cached
			assert.strictEqual(store.get(1).name, 'one');
			assert.strictEqual(store.get(4).name, 'four');
			assert.strictEqual(cachingStore.get(4).name, 'four');
			assert.strictEqual(store.get(4).name, 'four');
		},

		'filter': function () {
			store.isLoaded = store.canCacheQuery = function () {
				return false;
			};

			var collection = store.filter({prime: true});
			assert.strictEqual(collection.fetch().length, 3);
			assert.strictEqual(collection.cachingStore.get(3), undefined);

			collection = store.filter({even: true});
			assert.strictEqual(collection.fetch()[1].name, 'four');

			store.isLoaded = store.canCacheQuery = function () {
				return true;
			};
			collection = store.filter({prime: true});
			assert.strictEqual(collection.fetch().length, 3);
			assert.strictEqual(collection.cachingStore.get(3).name, 'three');
		},

		'filter with sort': function () {
			assert.strictEqual(store.filter({prime: true}).sort('name').fetch().length, 3);
			assert.strictEqual(store.filter({even: true}).sort('name').fetch()[1].name, 'two');
		},

		'put update': function () {
			var four = store.get(4);
			four.square = true;
			store.put(four);
			four = store.get(4);
			assert.isTrue(four.square);
			four = cachingStore.get(4);
			assert.isTrue(four.square);
			four = store.get(4);
			assert.isTrue(four.square);
		},

		'put new': function () {
			store.put({
				id: 6,
				perfect: true
			});
			assert.isTrue(store.get(6).perfect);
			assert.isTrue(cachingStore.get(6).perfect);
		},

		'add duplicate': function () {
			var threw;
			try {
				store.add({
					id: 6,
					perfect: true
				});
			} catch (e) {
				threw = true;
			}
			assert.isTrue(threw);
		},

		'add new': function () {
			store.add({
				id: 7,
				prime: true
			});
			assert.isTrue(store.get(7).prime);
			assert.isTrue(cachingStore.get(7).prime);
		},

		'cached filter': function () {
			store.fetch(); // should result in everything being cached
			masterFilterCalled = false;
			assert.strictEqual(store.filter({prime: true}).fetch().length, 3);
			assert.isFalse(masterFilterCalled);
		},

		'delayed cached filter': function () {
			var fetchCalled;
			var MasterCollection = declare(Store, {
				fetch: function () {
					fetchCalled = true;
					var def = new Deferred();
					setTimeout(function () {
						def.resolve([
							{id: 1, name: 'one', prime: false},
							{id: 2, name: 'two', even: true, prime: true},
							{id: 3, name: 'three', prime: true},
							{id: 4, name: 'four', even: true, prime: false},
							{id: 5, name: 'five', prime: true}
						]);
					}, 20);
					return def;
				}
			});
			var store = new (declare([MasterCollection, Cache]))();
			store.fetch(); // should result in everything being cached
			assert.isTrue(fetchCalled);
			fetchCalled = false;
			var testDef = new Deferred();
			var count = 0;
			store.filter({prime: true}).forEach(function () {
				count++;
			}).then(function () {
				assert.strictEqual(count, 3);
				assert.isFalse(fetchCalled);
				testDef.resolve(true);
			});
			return testDef;
		},

		'defaults to queryEngine of the cachingStore': function () {
			var store = new (declare([ Store, Cache ]))({
				cachingStore: new Memory()
			});

			assert.property(store.cachingStore, 'queryEngine');
			assert.strictEqual(store.queryEngine, store.cachingStore.queryEngine);
		}
	});
});
