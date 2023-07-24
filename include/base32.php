<?php

/*
 This script is a stripped down version of Denis Borzenko's base32 class.
 https://github.com/bbars/utils/blob/master/php-base32-encode-decode/Base32.php
*/

// Define the base32 alphabet (A-Z, 2-7)
$base32alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// A function for encoding raw bytes into base32
function encodeToBase32( $bytes ) {
	global $base32alphabet;

	$finalResult = '';

	$remainderValue = 0;
	$remainderSize = 0;
	
	for ( $bytePosition = 0; $bytePosition < strlen( $bytes ); $bytePosition++ ) {
		$binaryValue = ord( $bytes[ $bytePosition ] );

		$remainderValue = ( $remainderValue << 8 ) | $binaryValue;
		$remainderSize += 8;
	
		while ( $remainderSize > 4 ) {
			$remainderSize -= 5;

			$character = $remainderValue & ( 31 << $remainderSize );
			$character >>= $remainderSize;

			$finalResult .= $base32alphabet[ $character ];
		}
	}

	if ( $remainderSize > 0 ) {
		$remainderValue <<= ( 5 - $remainderSize );

		$character = $remainderValue & 31;

		$finalResult .= $base32alphabet[ $character ];
	}

	return $finalResult;
}
