Feature: Access to private area
	In order to check some things
	As an unothorized user
	I want to access private area

	Scenario: Unauthorized access
		When I go to path "/"
		Then I should see "It's a private area, anon."

	Scenario: Login page
		When I go to path "/login"
		Then I should see window named "Login window"
		And I should see text field "User"
		And I should see password field "Password"
		And button "Enter" should be disabled
