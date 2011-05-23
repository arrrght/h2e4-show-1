Ext.define('Login.controller.Login', {
	extend: 'Ext.app.Controller',

	models: [ 'User' ],

	init: function(){
		this.control({
			'button[action=login]': {
				click: this.onLoginClick
			}
		})
	},

	onLoginClick: function(btn, e){
		var form = btn.up('form');
		// Call endpoint (defined in view(Viewport/FormPanel) as DirectAPI: "api: { submit: Login.login }" )
		form.submit({
			success: function(){
				window.location = '/';
			}
		});
	}
});

// Server side code
Ext.endpoint('login', function(para){ //:: { "formHandler": "true" }
                                      // ^^^ look at this comment
	var ret = this,
	    User = Mongoose.model('User');

	// Call mongoose model 'auth'
	User.auth(para.username, para.password, function(user){
		if (user){
			// If auth success, set session var and return login
			ret.app.req.session.user_id = user.id;
			ret.app.req.session.user = user.login;
			ret.success({ login: user.login, id: user.id });
		}else{
			// If fails - say it
			ret.failure({ username: 'User not found!' });
		}
	});
	
	// Create one user with password if not exist
	User.findOne({ login: 'user'}, function(err, user){
		if (!user){
			// Look at password magic in model
			new User({ login: 'user', password: 'pass' }).save();
		}
	});
});
