<?php

/*
 This script provides functions for input validation of the login credentials using regular expressions.
*/

/* The requirements listed here are enforced by:
 1) The form on the login page.
   * NOTE: Password and two-factor validation is more basic on the login page due to HTML attribute limitations.
 2) The serverside login API script.
 3) The backend MySQL database.
*/

// Include the two-factor script
require_once( 'twofactor.php' );

/* Username requirements:
 Must be between 3 and 32 characters.
 Must contain only alphanumeric (A-Z, a-z, 0-9) and underscore (_) characters.
*/
function validateUsername( $username ) {
	return ( preg_match( "/^[a-zA-Z0-9_]{3,32}$/", $username ) === 1 );
}

/* Password requirements:
 Must be 12 or more characters (maximum does not matter because it's going to be hashed anyway).
 Must have 1 or more uppercase letters.
 Must have 1 or more lowercase letters.
 Must have 2 or more numbers.
 Must have 1 or more special characters.

 https://its.lafayette.edu/policies-draft/strongpasswords/
 https://www.ocpsoft.org/tutorials/regular-expressions/password-regular-expression/
*/
function validatePassword( $password ) {
	// This regular expression is too complex to be used in the input form so advanced password validation is only done on the server.
	return ( preg_match( "/^(?=.+[0-9]){2,}(?=.+[A-Z])(?=.+[a-z])(?=.+[\!\"\£\$\%\^\&\*\(\)\_\+\-\=\{\}\[\]\~\@\:\;\'\#\<\>\?\/\.\,\|\`]).{12,}$/", $password ) === 1 );
}

/* Two-factor requirements:
 Must be exactly the amount of digits from the two-factor script.
 Can contain spacing.
*/
function validateTwoFactor( $code ) {

	// Include the code length variable from the two-factor script.
	global $generatorDigits;

	// Remove all spacing before doing regex validation
	return ( preg_match( "/^[\d]{" . $generatorDigits . "}$/i", str_replace( ' ', '', $code ) ) === 1 );

}

?>
