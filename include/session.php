<?php

/*
 This script is for starting new sessions with the options
 configured below, and checking if the user is logged in.
*/

// NOTE: While the options below can be set using the web server configuration file, I prefer to do it here as it keeps everything in one place.

session_start( [
	'name' => 'sessionIdentifier', // Name of the session cookie
	'cookie_lifetime' => 0, // Lasts until the browser is closed
	'cookie_path' => '/', // Work across all pages
	'cookie_domain' => $_SERVER[ 'HTTP_HOST' ], // Work across the entire domain
	'cookie_secure' => true, // Only send over HTTPs connections
	'cookie_httponly' => true, // Prevent access via clientside scripts
	'cookie_samesite' => 'Strict', // Never send the cookie with cross-site requests
] );

// Quick helper function for checking if the user is logged in by checking if a session exists and checking the various variables from the login script are set
function isUserLoggedIn() : bool {
	return (
		session_status() === PHP_SESSION_ACTIVE &&
		isset( $_SESSION[ 'userIdentifier' ] ) &&
		isset( $_SESSION[ 'userName' ] )
	);
}

?>
