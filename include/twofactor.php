<?php

/*
 This script is for everything related to two-factor authentication.
*/

// Include the base32-encoding script
require_once( 'base32.php' );

// Define configuration for OTP URI and code generation
$otpUriIssuer = 'Degree Progression Dashboard'; // The name of the issuer for the OTP URI

$generatorAlgorithm = 'sha1'; // The algorithm to use when generating the codes
$generatorDigits = 6; // The number of digits to be generated in the codes
$generatorInterval = 30; // The number of seconds until the code refreshes

// A helper function for generating an one-time-password URI string that can be used to generate a QR code
// https://github.com/google/google-authenticator/wiki/Key-Uri-Format
function generateOTPURI( $secretKey, $userName ) {

	// Include the configuration variables
	global $otpUriIssuer, $generatorAlgorithm, $generatorDigits, $generatorInterval;

	// Base32-encode the secret key
	$safeSecretKey = encodeToBase32( $secretKey );

	// Percent-encode the issuer name
	$safeIssuer = rawurlencode( $otpUriIssuer );

	// Return the full time-based one-time-password URI
	return "otpauth://totp/$safeIssuer:$userName?secret=$safeSecretKey&issuer=$safeIssuer&algorithm=$generatorAlgorithm&digits=$generatorDigits&period=$generatorInterval";

}

// A function for generating time-based one-time-passwords using a secret
// https://www.rfc-editor.org/rfc/rfc6238
function generateTwoFactorCode( $secretKey, $skew = 0 ) {

	// Include the configuration variables
	global $generatorAlgorithm, $generatorDigits, $generatorInterval;

	// Calculate the current HOTP value based off the Unix timestamp and specified code refresh interval
	$hotpCounter = intdiv( time() - $skew, $generatorInterval );

	// Generate a HMAC of the HOTP counter converted into a big-endian unsigned long long, using the secret key and the specified algorithm
	$hash = hash_hmac( $generatorAlgorithm, pack( "J", $hotpCounter ), $secretKey, true );

	// Calculate where the TOTP value is located within the HMAC by taking the 4 least significant bits
	$hashOffset = ord( $hash[ strlen( $hash ) - 1 ] ) & 0b00001111;

	// Extract the TOTP value from the generated HMAC using the calculated byte offset, then convert it to a big-endian unsigned integer
	$hashTruncated = unpack( "N", substr( $hash, $hashOffset, 4 ) )[ 1 ] & 0x7fffffff;

	// Return the TOTP code padded with leading zeros up to the specified number of digits
	return str_pad( $hashTruncated % pow( 10, $generatorDigits ), $generatorDigits, '0', STR_PAD_LEFT );

}

?>
