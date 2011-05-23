// Code for ext4
Ext.define('Login.model.User', {
	extend: 'Ext.data.Model',

	fields: [
		{ name: 'login', type: 'string' },
		{ name: 'password', type: 'string' },
	]

});

// Code for Mongoose
var Schema = Mongoose.Schema,
    crypto = require('crypto'),
		ObjectId = Schema.ObjectId,
		Query = Mongoose.Query,
		userFields = Ext.getModel('User');

/* We can define whole shema
var User = new Schema({
	login: String,
	pswd: { salt: String , hash: String }
});
*/

// .. or just change some fields
delete userFields.password; // virtual it
userFields.pswd = { salt: String , hash: String };

var User = new Schema(userFields);

// virtual field
User.virtual('password')
	.set(function(pass){
		var salt = (function getSalt(){
			var str = '', chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
			chars.forEach(function(){ str += chars[Math.floor(Math.random() * chars.length)] });
			return str;
		})();
		this.set('pswd.salt', salt);
		this.set('pswd.hash', getCrypted(salt, pass));
	})
	.get(function(){
		return this.pswd.hash
	});

function getCrypted(salt, pass){
	return crypto.createHmac('sha1', salt).update(pass).digest('hex')
};

User.static({
	auth: function(login, password, callback){
		this.findOne({ login: login }, function(err, user){
			if (user && user.password === getCrypted(user.pswd.salt, password)){
				callback(user);
			}else{
				callback(null);
			}
		});
	}
});

// Register model at last
Mongoose.model('User', User);
