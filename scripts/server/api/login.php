<?php

/*
 This script is for handling and responding to the login API requests.
*/

// Include other scripts that are required for operation
require_once( '../../../include/database.php' );
require_once( '../../../include/twofactor.php' );
require_once( '../../../include/api.php' );
require_once( '../../../include/validate.php' );

// Store the attempted login credentials from the incoming POST request
$loginUsername = $_POST[ 'username' ];
$loginPassword = $_POST[ 'password' ];
$loginTwoFactor = $_POST[ 'twoFactor' ];

// Respond with the malformed input status code if the username or password are somehow not set
if ( empty( $loginUsername ) || empty( $loginPassword ) ) respondToRequest( StatusCode::MalformedInput );

// Respond with the appropriate validation failed status codes if the username or passwords do not meet their minimum requirements
if ( !validateUsername( $loginUsername ) ) respondToRequest( StatusCode::UsernameValidationFailure );
if ( !validatePassword( $loginPassword ) ) respondToRequest( StatusCode::PasswordValidationFailure );

// Query the database to fetch the identifier, password and decrypted two-factor secret for the user with the attempted username
// See the server registration script for notes about the encryption used here
$userRecord = Database::Query( 'SELECT users.userIdentifier, users.userPassword, AES_DECRYPT( users.userTwoFactor, UNHEX( SHA2( :userPassword, 512 ) ), users.userInitVector ) AS userTwoFactor FROM users WHERE users.userName = :userName LIMIT 1;', [
	':userName' => [ $loginUsername, PDO::PARAM_STR ],
	':userPassword' => [ $loginPassword, PDO::PARAM_STR ]
], true );

// Respond with the user does not exist status code if the query returned false
if ( $userRecord === false ) respondToRequest( StatusCode::UnknownUser );

// Respond with the incorrect password status code if the hashed password does not match the one in the database
if ( !password_verify( $loginPassword, $userRecord[ 'userPassword' ] ) ) respondToRequest( StatusCode::IncorrectPassword );

// If two-factor is required for this user...
if ( !empty( $userRecord[ 'userTwoFactor' ] ) ) {

	// Return the two-factor authentication code required status code if the no two-factor code was provided
	if ( empty( $loginTwoFactor ) ) respondToRequest( StatusCode::TwoFactorCodeRequired );

	// Respond with the two-factor validation failed status code if the two-factor code does not meet the minimum requirements
	if ( !validateTwoFactor( $loginTwoFactor ) ) respondToRequest( StatusCode::TwoFactorValidationFailure );

	// Generate three two-factor authentication codes (past, present, future) to account for clock skew, using the secret from the database
	$serverTwoFactorCodes = [];
	for ( $iteration = -1; $iteration < 2; $iteration++ ) array_push( $serverTwoFactorCodes, generateTwoFactorCode( $userRecord[ 'userTwoFactor' ], $iteration * $generatorInterval ) );

	// Respond with the two-factor authentication code incorrect status if the provided code does not match the server generated ones
	if ( !in_array( str_replace( ' ', '', $loginTwoFactor ), $serverTwoFactorCodes ) ) respondToRequest( StatusCode::TwoFactorCodeIncorrect );

}

// Remove a previous session if it exists
if ( session_status() === PHP_SESSION_ACTIVE ) session_destroy();

// Create a new session by including the session script
require_once( '../../../include/session.php' );

// Populate the data for this new session with the user details
$_SESSION[ 'userIdentifier' ] = $userRecord[ 'userIdentifier' ];
$_SESSION[ 'userName' ] = $loginUsername;

// Respond with success if we've made it this far
respondToRequest( StatusCode::Success );

?>
