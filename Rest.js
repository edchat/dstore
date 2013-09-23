define(["dojo/request/registry", "dojo/_base/lang", "dojo/json", "dojo/io-query", "dojo/_base/declare", "./Request" /*=====, "./api/Store" =====*/
], function(request, lang, JSON, ioQuery, declare, Request /*=====, Store =====*/){

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
var base = null;
/*===== base = Store; =====*/

/*=====
var __HeaderOptions = {
		// headers: Object?
		//		Additional headers to send along with the request.
	},
	__PutDirectives = declare(Store.PutDirectives, __HeaderOptions),
	__QueryOptions = declare(Store.QueryOptions, __HeaderOptions);
=====*/

return declare(Request, {

	// stringify: Function
	//		This function performs the serialization of the data for requests to the server. This
	//		defaults to JSON, but other formats can be serialized by providing an alternate
	//		stringify function. If you do want to use an alternate format, you will probably 
	//		want to use an alternate parse function for the parsing of data as well.
	stringify: JSON.stringify,

	 

	get: function(id, options){
		// summary:
		//		Retrieves an object by its identity. This will trigger a GET request to the server using
		//		the url `this.target + id`.
		// id: Number
		//		The identity to use to lookup the object
		// options: Object?
		//		HTTP headers. For consistency with other methods, if a `headers` key exists on this object, it will be
		//		used to provide HTTP headers instead.
		// returns: Object
		//		The object in the store that matches the given id.
		options = options || {};
		var headers = lang.mixin({ Accept: this.accepts }, this.headers, options.headers || options);
		var model = this.model;
		var parse = this.parse;
		var store = this;
		return request(this.target + id, {
			headers: headers
		}).then(function(response){
			return store.assignPrototype(parse(response));
		});
	},


	put: function(object, options){
		// summary:
		//		Stores an object. This will trigger a PUT request to the server
		//		if the object has an id, otherwise it will trigger a POST request.
		// object: Object
		//		The object to store.
		// options: __PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: dojo/_base/Deferred
		options = options || {};
		var id = ("id" in options) ? options.id : this.getIdentity(object);
		var hasId = typeof id != "undefined";
		var model = this.model;
		var parse = this.parse;
		var store = this;
		return request(hasId ? this.target + id : this.target, {
				method: hasId && !options.incremental ? "PUT" : "POST",
				postData: this.stringify(object),
				headers: lang.mixin({
					"Content-Type": "application/json",
					Accept: this.accepts,
					"If-Match": options.overwrite === true ? "*" : null,
					"If-None-Match": options.overwrite === false ? "*" : null
				}, this.headers, options.headers)
			}).then(function(response){
				return store.assignPrototype(parse(response));
			});
	},

	add: function(object, options){
		// summary:
		//		Adds an object. This will trigger a PUT request to the server
		//		if the object has an id, otherwise it will trigger a POST request.
		// object: Object
		//		The object to store.
		// options: __PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		options = options || {};
		options.overwrite = false;
		return this.put(object, options);
	},

	remove: function(id, options){
		// summary:
		//		Deletes an object by its identity. This will trigger a DELETE request to the server.
		// id: Number
		//		The identity to use to delete the object
		// options: __HeaderOptions?
		//		HTTP headers.
		options = options || {};
		return request(this.target + id, {
			method: "DELETE",
			headers: lang.mixin({}, this.headers, options.headers)
		}).then(this.parse);
	}
});

});