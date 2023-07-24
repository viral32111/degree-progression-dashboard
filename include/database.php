<?php

/*
 This script is for storing the database credentials and establishing a connection.
*/

// Include the API script
require_once( 'api.php' );

// Create a static class for encapsulating all of the operations related to the database
class Database {

	// Privately store the connection details so they cannot be read by any other script
	private static string $databaseAddress = '';
	private static int $databasePort = 3306;
	private static int $databaseTimeout = 3; // In seconds
	private static string $databaseName = '';

	// Privately store the credentials so they cannot be read by any other script
	private static string $databaseUsername = '';
	private static string $databasePassword = '';

	// Store the database connection PDO object as public so the registration script can still access it
	public static ?PDO $databaseConnection = null;

	// Create a publicly accessible function for connecting to the database
	public static function Connect() {

		// Attempt to create a new database connection using the above options that fails after a configured number of seconds (stackoverflow.com/a/21403360)
		try {
			self::$databaseConnection = new PDO( sprintf( "mysql:host=%s;port=%d;dbname=%s", self::$databaseAddress, self::$databasePort, self::$databaseName ), self::$databaseUsername, self::$databasePassword, [
				PDO::ATTR_TIMEOUT => self::$databaseTimeout,
				PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
			] );

			// Register a function to disconnect from the database that executes when server-side processing finishes
			register_shutdown_function( 'Database::Disconnect' );

		// Respond with a failure if an error occurs while connecting...
		} catch ( PDOException $exception ) {
			respondToRequest( StatusCode::Error, $exception->getMessage(), 500 );
		}

	}

	// Quick publicly accessible function to disconnect from the database by assigning null to the connection attribute
	public static function Disconnect() {
		self::$databaseConnection = null;
	}

	// Create a publicly accessible function for running SQL queries on the database
	public static function Query( $sqlCode, array $valuesToBind = [], $expectSingleResult = false ) {

		// Respond with an error if no database connection has been established yet
		if ( !isset( self::$databaseConnection ) ) respondToRequest( StatusCode::Error, 'Cannot query database without connecting first.', 500 );

		// Create a prepared statement using the provided SQL code
		$statement = self::$databaseConnection->prepare( $sqlCode );

		// Loop through the provided values for binding to the prepared statement...
		foreach ( $valuesToBind as $placeholderName => $valueToBind ) {
			
			// Respond with an error if both the value and data type have not been provided
			if ( count( $valueToBind ) !== 2 ) respondToRequest( StatusCode::Error, 'Need value and type for binding value to prepared statement!', 500 );

			// Bind the value to the prepared statement in the corresponding placeholder spot
			$statement->bindValue( $placeholderName, $valueToBind[ 0 ], $valueToBind[ 1 ] );

		}

		// Execute the prepared statement
		$statement->execute();

		// If the query is intended to give results...
		if ( str_starts_with( $sqlCode, 'SELECT' ) === true ) {

			// Fetch all the results from the prepared statement as an associative array where the keys are the column names
			$results = $statement->fetchAll( PDO::FETCH_ASSOC );

			// Return false if there are no results
			if ( empty( $results ) ) return false;

			// Return the result(s) based on whether or not a single result is expected
			return ( $expectSingleResult ? $results[ 0 ] : $results );

		// Otherwise, just return the number of rows affected by the query
		} else {
			return $statement->rowCount();
		}

	}

}

// Connect to the database by including this script
Database::Connect();

?>
