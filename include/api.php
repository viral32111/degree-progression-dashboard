<?php

/*
 This script is for providing functions for other scripts acting as RESTful APIs.
*/

/* Used HTTP status codes:
 https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

 200 OK - Default response for successful API requests
 400 Bad Request - Unknown action for the dashboard API script
 401 Unauthorized - User visited the dashboard without logging in
 403 Forbidden - User attempted to access the registration script
 500 Internal Server Error - An error occurred while connecting to the database
*/

/*
 These PHP configuration values have been set in the web server configuration file
 to increase security by hiding errors from the end user that may potentially contain
 sensitive data such as credentials, script paths, and other server settings:
  error_reporting 32767
  html_errors off
  display_errors off
  display_startup_errors off
  log_errors on
*/

// Define enumerations for the custom status codes
// NOTE: This requires the very latest version of PHP, as it is a 8.1+ feature (php.net/releases/8.1/en.php)
enum StatusCode: int {

	// Used by all scripts
	case Error = -1;
	case Success = 0;

	// Used by the login script
	case MalformedInput = 1;
	case UnknownUser = 2;
	case IncorrectPassword = 3;
	case TwoFactorCodeRequired = 4;
	case TwoFactorCodeIncorrect = 5;

	case UsernameValidationFailure = 7;
	case PasswordValidationFailure = 8;
	case TwoFactorValidationFailure = 9;

	// Used by the dashboard script
	case UserNotLoggedIn = 6;

	case AssignmentIdentifierEmpty = 10;
	case AssignmentScoreEmpty = 11;
	case AssignmentIdentifierInvalid = 12;
	case AssignmentScoreInvalid = 13;

}

// A helper function to give a response back to the requestor
// NOTE: The never return type requires PHP 8.1+ (php.net/releases/8.1/en.php)
function respondToRequest( $statusCode, $extraData = null, $httpStatusCode = 200 ) : never {

	// Set the HTTP response status code to the one provided
	http_response_code( $httpStatusCode );

	// Set the response type header to JSON
	header( 'Content-Type: application/json' );

	// Stop processing after outputting a JSON string containing our data
	exit( json_encode( [
		'status' => $statusCode->value, // Get the numeric value of the enumeration
		'data' => $extraData
	] ) );

}

?>
