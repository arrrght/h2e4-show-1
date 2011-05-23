Ext.define('Login.view.Viewport', {
    extend: 'Ext.window.Window',

		initComponent: function() {
			Ext.apply(this, {
				autoShow: true,
				title: 'Login window',
				width: 350, autoHeight: true,
				closable: false, resizable: false, bodyStyle: 'background-color:#DFE8F6; padding: 5px;',
				items: Ext.create('Ext.form.FormPanel', {
					border: false, bodyStyle: 'background-color:#DFE8F6;', 
					api: { submit: Login.login },
					buttons: [{ text: 'Login', action: 'login' }],
					defaultType: 'textfield',
					defaults: { anchor: '100%', allowBlank: false, msgTarget: 'side' },
					items: [
						{ name: 'username', fieldLabel: 'User' },
						{ name: 'password', fieldLabel: 'Password', inputType: 'password' }
					]
				})
			});
			this.callParent(arguments);
		}
});

Ext.define('App.view.Viewport', {
    extend: 'Ext.container.Viewport',

		initComponent: function() {
			Ext.apply(this, {
				layout: 'fit',
				items: {
					xtype: 'panel',
					html: 'It\'s a private area, <%= session.user %>.'
				}
			});
			this.callParent(arguments);
		}
});

