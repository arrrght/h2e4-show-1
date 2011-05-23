var Steps = require('cucumis').Steps,
    should = require('should'),
    soda = require('soda'),
		baseUrl = 'http://0.0.0.0:3000',
		browser = soda.createClient({ host: 'localhost', port: 4444, url: baseUrl, browser: 'firefox' });

Steps.Runner.on('afterTest', function(done) {
	if (browser) {
		browser.chain.testComplete().end(function (err) {
			if (err) throw err;
			done();
		});
	} else {
		done();
	}
});
Steps.Then(/^I should see window named "([^"]*?)"$/, function (ctx, arg1) {
	ctx.pending();
});

Steps.Then(/^I should see text field "([^"]*?)"$/, function (ctx, arg1) {
	ctx.pending();
});

Steps.Then(/^I should see password field "([^"]*?)"$/, function (ctx, arg1) {
	ctx.pending();
});

Steps.Then(/^button "([^"]*?)" should be disabled$/, function (ctx, arg1) {
	ctx.pending();
});

Steps.Given(/^I am using the "([^"]*)" browser$/, function (ctx, bt) {
	browser.chain.session().end(function(err) {
			if (err) throw err;
			ctx.done();
		});
});

Steps.When(/^I go to path "([^"]*?)"$/, function (ctx, url) {
	browser.chain.session().open(baseUrl + url).end(function(err) {
			if (err) throw err;
			ctx.done();
		});
});

Steps.Then(/^I should see "([^"]*?)"$/, function (ctx, arg1) {
	browser.assertTextPresent( arg1).end(function(err){ if(err){ throw err } ctx.done() });
});

Steps.export(module);

