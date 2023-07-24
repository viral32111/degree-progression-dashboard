/*
 This script is for handling and updating the login form when submitted.
*/

// Store all page elements in variables for quick access
const loginForm = document.getElementById( "login-form" );
const loginFormUsername = document.getElementById( "login-form-username" );
const loginFormPassword = document.getElementById( "login-form-password" );
const loginFormTwoFactor = document.getElementById( "login-form-twofactor" );
const loginFormSubmit = document.getElementById( "login-form-submit" );
const loginFormSubmitLoading = document.getElementById( "login-form-submit-loading" );

const alertBox = document.getElementById( "alert-box" );
const alertBoxTitle = document.getElementById( "alert-box-title" );
const alertBoxText = document.getElementById( "alert-box-text" );

// Set configuration options here for easy changing
const loginFormSubmitDelay = 500; // Milliseconds to wait before form responds
const loginFormTwoFactorPlaceholder = "123 456"; // The example two-factor code

// Store the previous alert type for checking when removing alerts
let previousAlertIsError = true;

// A helper function for showing alerts with custom type and text
const showAlert = ( text, isError = true ) => {

	// Remove the previous alert type class from the alert box
	alertBox.classList.remove( "alert-" + ( previousAlertIsError ? "danger" : "info" ) );
	
	// Add the new alert type class to the alert box
	alertBox.classList.add( "alert-" + ( isError ? "danger" : "info" ) );

	// Set the alert title if the new alert is an error, otherwise clear it
	if ( isError ) {
		alertBoxTitle.innerText = "Oops!";
	} else {
		alertBoxTitle.innerText = "";
	}

	// Set the alert text to the passed text option
	alertBoxText.innerText = text;

	// Show the alert box by removing the hidden class
	alertBox.classList.remove( "invisible" );

	// Update variable to store if the previous alert was an error or not
	previousAlertIsError = isError;

}

// A helper function to toggle the form inputs and loading spinner 
const setLoginFormLoading = ( isLoading, disableTwoFactor = true ) => {

	// Enable or disable the form inputs to prevent repeated login requests
	loginFormUsername.disabled = isLoading;
	loginFormPassword.disabled = isLoading;
	loginFormTwoFactor.disabled = disableTwoFactor;
	loginFormSubmit.disabled = isLoading;

	// Show or hide the loading spinner on the submit button
	if ( isLoading ) {
		loginFormSubmitLoading.classList.remove( "invisible" );
	} else {
		loginFormSubmitLoading.classList.add( "invisible" );
	}

}

// Add an event listener with a callback to run asyncronously whenever the login form is submitted
loginForm.addEventListener( "submit", async ( event ) => {

	// Prevent the default action to refresh the page
	event.preventDefault();

	// Make the form appear to be loading
	setLoginFormLoading( true );

	// Unfocus the form inputs to prevent typing after submitting & to individually refocus later
	loginFormUsername.blur();
	loginFormPassword.blur();
	loginFormTwoFactor.blur();
	loginFormSubmit.blur();

	// Hide the alert box in case there were any previous alerts before this login attempt
	alertBox.classList.add( "invisible" );

	// Send a request to the server login script to validate the submitted credentials
	const apiResponse = await fetch( "scripts/server/api/login.php", {
		method: "POST",
		body: new URLSearchParams( {
			"username": loginFormUsername.value,
			"password": loginFormPassword.value,
			"twoFactor": loginFormTwoFactor.value
		} )
	} );

	// If the HTTP response status code is not success (within 200 range)...
	if ( !apiResponse.ok ) {

		// Show an error alert
		showAlert( "A server error has occured, try again later." );

		// Stop the form loading state
		setLoginFormLoading( false );

		// Create a new exception with the server response
		throw new Error( ( await apiResponse.text() ) );

	}

	// Get the JSON content of the response from the server
	const apiResponseData = await apiResponse.json();

	// Get the status code within the server response data
	const statusCode = apiResponseData[ "status" ];

	// Pause for a moment to prevent rapid repeated login attempts by promisifying the timeout function
	await new Promise( ( resolve ) => setTimeout( resolve, loginFormSubmitDelay ) );

	// Check the serverside api.php script for a list of available status codes

	// Redirect to the dashboard page and prevent further execution if the credentials were valid...
	if ( statusCode === 0 ) {
		window.location.href = "index.html";
		return;

	// Show an alert if the input was malformed or invalid...
	} else if ( statusCode === 1 ) {
		showAlert( "There is an issue with your credentials, please try again." );

	// Show an alert & focus appropriate input if no user with the provided username exists...
	} else if ( statusCode === 2 ) {
		showAlert( "There is no user with that name, please try again." );
		loginFormUsername.focus();

	// Show an alert & focus appropriate input if the user's password is incorrect...
	} else if ( statusCode === 3 ) {
		showAlert( "Your password is incorrect, please try again." );
		loginFormPassword.focus();

	// If the user's two-factor authentication code is required...
	} else if ( statusCode === 4 ) {
		// Show an informational alert
		showAlert( "Your two-factor authentication code is required to continue.", false );

		// Enable the two-factor code form input and set an example placeholder
		loginFormTwoFactor.disabled = false;
		loginFormTwoFactor.placeholder = loginFormTwoFactorPlaceholder;

		// Focus the two-factor code form input
		loginFormTwoFactor.focus();

	// Show an alert & focus appropriate input if the user's two-factor authentication code is incorrect...
	} else if ( statusCode === 5 ) {
		showAlert( "Your two-factor code is incorrect, please try again." );
		loginFormTwoFactor.focus();

	// Show an alert & focus appropriate input if the username does not meet the minimum requirements
	} else if ( statusCode === 7 ) {
		showAlert( "Your username does not meet the requirements." );
		loginFormUsername.focus();

	// Show an alert & focus appropriate input if the password does not meet the minimum requirements
	} else if ( statusCode === 8 ) {
		showAlert( "Your password does not meet the requirements." );
		loginFormPassword.focus();

	// Show an alert & focus appropriate input if the two-factor code is not the correct length (or malformed in any way)
	} else if ( statusCode === 9 ) {
		showAlert( "Your two-factor code is malformed." );
		loginFormTwoFactor.focus();

	// An unknown status code was returned
	} else {
		showAlert( "An unknown error has occured, try again later." );
	}

	// Disable the form appearing to be loading
	setLoginFormLoading( false, ( statusCode !== 4 && statusCode !== 5 && statusCode !== 9 ) );

} );
