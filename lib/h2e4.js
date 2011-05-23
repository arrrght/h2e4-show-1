var Schema = Mongoose.Schema,
		ObjectId = Schema.ObjectId,
		Query = Mongoose.Query,
    fs = require('fs'),
		util = require('util');

// Global Ext4 fake
Ext = {
	// Placeholders
	api: {},
	services: {},
	src: { model: {}, controller: {} },
	obj: { model: {}, controller: {} },

	// Catch server side code
	endpoint: function(name, fun){
		console.log('* Catch endpoint ' + this.lastClassName);
		var m = fun.toString().match(/\/\/::\ +(.+)\n/);

		if (typeof(this.api[this.lastClassName]) === 'undefined'){
			this.api[this.lastClassName] = [];
			this.services[this.lastClassName] = {};
		}
		this.api[this.lastClassName].push(getDef({ name: name, len: 1}, fun));
		this.services[this.lastClassName][name] = fun;

		function getDef(def, fun){
			// work with //:: { "formHandler": "true" } 
			var m = fun.toString().match(/\/\/::\ +(.+)\n/);
			if(m){
				var a = JSON.parse(m[1]);
				for (var key in a){ def[key] = a[key] }
			}
			return def;
		}
	},

	getModel: function(name){
		return this.obj.model[name];
	},

	// Catch Ext.define('App.controller.MyController ...
	define: function(className, data){
		var that = this,
		    cnArr = className.split('.'),
		    clsApp = cnArr[0], // App name
		    clsType = cnArr[1], // Type of class
		    clsName = cnArr.slice(2).join('.'); // Actually class name

		console.log('* Passing ' + className);
		
		this.lastClassName = clsName;
		this.obj[clsType][clsName] = data;
		this.src[clsType][clsName] = 'Ext.define(\'' + className + '\',\n' + rec(data, 0) + '\n);';

		if (clsType == 'model'){
			// Model parse
			var modelFields = data.fields,
			    mngFields = {};

			modelFields.forEach(function(field){
				if (field.name != '_id'){
					mngFields[field.name] = cnvType(field.name, field.type);
				}
			});
			that.obj.model[clsName] = mngFields;
		}
	}
};

// Some routes
exports.init = function(app){
	var that = this;
	// Print out as plain javascript
	app.all('/direct/entry', function(req, res, next){
		// WTF? Null body?
		typeof(req.body) === 'undefined' ? next() : that.directEntry(req, res, next);
	});
	app.get('/direct/api', this.showApi);
	app.get('/app/controller/*', this.showController);
	app.get('/app/model/*', this.showModel);
	app.get('/app/*', function(req, res){
		res.header('Content-type', 'text/javascript');
		res.partial(__dirname + '/../' + req.url);
	});
	app.dynamicHelpers(this.dinamicHelpers);
	return this;
}
exports.dinamicHelpers = {
	session: function(req,res){
		return req.session;
	}
}
exports.directEntry = function(req, res, next){
	var that = this,
	    contentType = req.headers['content-type'] || '',
	    data = [],
	    retArr = [];

	// Request if's
	if (contentType.indexOf('application/x-www-form-urlencoded') >= 0){
		// Form
		var changeFields = { extAction: 'action', extMethod: 'method', extTID: 'tid', extType: 'type' };
		for (var x in changeFields){
			if (req.body[x]){
				req.body[changeFields[x]] = req.body[x];
				delete req.body[x];
			}
		}
		data.push(req.body);
	}else if (contentType.indexOf('application/json') >= 0){
		// JSON
		if (req.body instanceof Array){
			data = req.body;
		}else{
			data.push(req.body);
		}
	}else{ /* Or f@#@# what? TODO / FIXME */ }

	var dataL = data.length;
	data.forEach(function(rpc){
		var method = Ext.services[rpc.action][rpc.method];

		// Callback template
		var reply = {
			app: { req: req, res: res, next: next },
			ret: { action: rpc.action, method: rpc.method, tid: rpc.tid, type: rpc.type, result: {} },
			respond: function(){
				console.log('Called \x1b[32m'+this.ret.action+'.\x1b[33m'+this.ret.method + '\x1b[0m' + ' len: ' + retArr.length);
				if (--dataL<1){ respond( res, retArr.length > 1 ? retArr : retArr.shift() ) }
			},
			success: function(result){
				this.ret.result = result;
				this.ret.result.success = true;
				retArr.push(this.ret);
				this.respond();
			},
			failure: function(result){
				this.ret.result.errors = result;
				this.ret.result.success = false;
				retArr.push(this.ret);
				this.respond();
			}
		};

		try{
			// Call controller
			method.call(reply, rpc);
		}catch(err){
			// WARN - all debug to user ))
			reply.failure(err.toString());
			console.log('\x1b[31mDIE:\n\x1b[0m ' + err + '\n' + util.inspect(err));
		}
	});
	
}

// Prints Ext4 Direct API
exports.showApi = function(req, res, next){
	var result = { type: 'remoting', url: '/direct/entry', actions: Ext.api };
	res.writeHead(200, { 'Content-type': 'text/javascript' });
	res.write('Ext.app.REMOTING_API=' + JSON.stringify(result));
	res.end(';Ext.Direct.addProvider(Ext.app.REMOTING_API);Ext.app.REMOTING_API.enableBuffer=100;');
}

// Prints model source code (copy-paste FIXME)
exports.showModel = function(req, res, next){
	var modelName = req.url.slice(req.url.lastIndexOf('/'), req.url.lastIndexOf('.')).replace(/\W/g,'');
	console.log('Get controller ' + modelName);
	res.writeHead(200, { 'Content-type': 'text/javascript' });
	res.end(Ext.src.model[modelName]);
}

// Prints controller source code
exports.showController = function(req, res, next){
	var modelName = req.url.slice(req.url.lastIndexOf('/'), req.url.lastIndexOf('.')).replace(/\W/g,'');
	console.log('Get controller ' + modelName);
	res.writeHead(200, { 'Content-type': 'text/javascript' });
	res.end(Ext.src.controller[modelName]);
}

// Runs this on init
// Parse models
fs.readdirSync(__dirname + '/../app/model').forEach(function(f) {
	if(f.match(/.js$/)){
		var name = f.slice(0, f.lastIndexOf('.'));
		var o = require(__dirname + '/../app/model/' + f);
	}
});

// Parse controllers
fs.readdirSync(__dirname + '/../app/controller').forEach(function(f) {
	if(f.match(/.js$/)){
		var name = f.slice(0, f.lastIndexOf('.'));
		var o = require(__dirname + '/../app/controller/' + f);
	}
});


// Local functions
// Convert types from Ext4 model to Mongoose
function cnvType(n,t){
	if (t == 'string'){
		return String
	}else if(t == 'float'){
		return Number
	}
	return 'unknown';
}
// Print out response
function respond(res, obj) {
	var body = JSON.stringify(obj);
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(body)
	});
	res.end(body);
}

// Checkout object is Date
function isDate(d) {
	if (d instanceof Date) return true;
	if (typeof d !== 'object') return false;
	var properties = Date.prototype && Object.getOwnPropertyNames(Date.prototype);
	var proto = d.__proto__ && Object.getOwnPropertyNames(d.__proto__);
	return JSON.stringify(proto) === JSON.stringify(properties);
}

// Checkout object is Array
function isArray(ar) {
	return ar instanceof Array ||
				 Array.isArray(ar) ||
				 (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

// Inverted parse JS
function rec(obj, spc){
	if(obj == null){
		return 'null';
	}else if(typeof(obj) == 'string'){
		return '"' + obj + '"';
	}else if(isDate(obj)){
		return '"' + obj.toString() + '"';
	}else if(typeof(obj) === 'object'){
		var braces = (isArray(obj) ? '[]':'{}').split('');
		var ret = braces[0];
		for(var i in obj){
			if (isArray(obj)){
				ret += rec(obj[i], spc) + ', ';
			}else{
				ret += i + ': ' + rec(obj[i], spc) + ', ';
			}
		}
		ret = ret.slice(0, -2);
		return ret + braces[1];
	}else{
		return obj;
	}
}


