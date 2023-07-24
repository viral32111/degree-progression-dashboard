<?php

/*
 This script is for handling and responding to the dashboard API requests.
*/

// Include other scripts that are required for operation
require_once( '../../../include/database.php' );
require_once( '../../../include/session.php' );
require_once( '../../../include/api.php' );

// Create a helper function for running the queries required for selecting modules for a specific year of the course the user is on
function setYearStartFinish( $courseYear ) {

	// Firstly set the finish time variable for the modules by adding the x years to the earliest module start date
	Database::Query( 'SELECT modules.moduleStart + INTERVAL :courseYear YEAR INTO @finishYear FROM modules ORDER BY modules.moduleStart ASC LIMIT 1;', [
		':courseYear' => [ $courseYear, PDO::PARAM_INT ]
	] );

	// Next set the start time variable for the modules by subtracting a year (and 1 day to account for calender shift) from the above finish time
	Database::Query( 'SET @startYear = @finishYear - INTERVAL 1 YEAR - INTERVAL :courseYear DAY;', [
		':courseYear' => [ $courseYear, PDO::PARAM_INT ]
	] );

}

// If this is a GET request...
if ( $_SERVER[ 'REQUEST_METHOD' ] === 'GET' ) {

	// Do not continue if the user is not logged in
	if ( !isUserLoggedIn() ) respondToRequest( StatusCode::UserNotLoggedIn );

	// Create an associative array for holding the collated results from the multiple queries below to be used in the dashboard graphs
	$graphData = [
		'nextAssignmentDue' => NULL,
		'randomModuleScores' => NULL,
		'moduleScores' => [],
		'yearAverages' => [],
		'moduleCompletionProgress' => []
	];

	/********** Next assignment due **********/

	// Fetch the next assignment by future due date, by accounting for the user's course, and what modules are on that course, and what assignments are on those modules
	$nextAssignmentDue = Database::Query( 'SELECT assignments.assignmentName, UNIX_TIMESTAMP( assignments.assignmentDue ) AS assignmentDue, modules.moduleName FROM assignments LEFT JOIN modules ON modules.moduleIdentifier = assignments.assignmentModule LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier AND assignments.assignmentDue >= CURRENT_TIMESTAMP() ORDER BY assignments.assignmentDue ASC LIMIT 1;', [
		':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
	], true );

	// If the user hasn't finished their course yet then populate the final response array
	if ( $nextAssignmentDue !== false ) $graphData[ 'nextAssignmentDue' ] = [
		'name' => $nextAssignmentDue[ 'assignmentName' ],
		'due' => date( 'jS \o\f F \a\t H:i', intval( $nextAssignmentDue[ 'assignmentDue' ] ) ), // It would be better for the API to return the raw Unix timestamp value, then allow the client to format it however they wish, but in this case JavaScript does not have a good way to do custom date formatting so it is done here instead.
		'module' => $nextAssignmentDue[ 'moduleName' ]
	];

	/********** Random module scores **********/

	// Fetch a random module and store the result in associative array, by accounting for the user's course, and what modules are on that course
	$randomModule = Database::Query( 'SELECT modules.moduleIdentifier, modules.moduleName FROM modules LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier ORDER BY RAND() LIMIT 1;', [
		':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
	], true );

	// Respond with an error if the user has no modules in their course
	if ( $randomModule === false ) respondToRequest( StatusCode::Error, 'No modules in course', 500 );

	// Fetch all the assignment names, scores, and marks for this random module
	$randomAssignments = Database::Query( 'SELECT assignments.assignmentName, assignments.assignmentScore, assignments.assignmentMarks FROM assignments WHERE assignments.assignmentModule = :moduleIdentifier;', [
		':moduleIdentifier' => [ $randomModule[ 'moduleIdentifier' ], PDO::PARAM_INT ]
	] );

	// Respond with an error if there are no assignments in this module
	if ( $randomAssignments === false ) respondToRequest( StatusCode::Error, 'No assignments in module', 500 );

	// Create an array in the results array to hold the random module name and assignment scores
	$graphData[ 'randomModuleScores' ] = [
		'module' => $randomModule[ 'moduleName' ],
		'assignments' => []
	];

	// Populate the assignment scores in the above array with the results from the query
	foreach ( $randomAssignments as $assignment ) $graphData[ 'randomModuleScores' ][ 'assignments' ][ $assignment[ 'assignmentName' ] ] = [
		'score' => intval( $assignment[ 'assignmentScore' ] ),
		'marks' => intval( $assignment[ 'assignmentMarks' ] )
	];

	/********** Module scores and average grades **********/

	/*
	 NOTE: While the brief only states it should show the 1st and 2nd year module scores and average grades,
	 the below implementation is designed to work with any number of years for future-proofing and robustness.
	*/

	// Fetch the duration of the course (in years) that the user is on
	$courseDuration = Database::Query( 'SELECT courses.courseDuration FROM courses INNER JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier;', [
		':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
	], true );

	// Respond with an error if the course somehow has no duration
	if ( $courseDuration === false ) respondToRequest( StatusCode::Error, 'No duration in course', 500 );

	// Loop through each year of the course...
	for ( $courseYear = 1; $courseYear <= $courseDuration[ 'courseDuration' ]; $courseYear++ ) {

		// Prepare for the two queries below by setting the start and finish dates for the year
		setYearStartFinish( $courseYear );

		/********** Module scores each year of the course **********/

		// Fetch the module names, and summed assignment scores & marks for each module, ordered from highest to lowest score, within the above start and finish range, for this user's course
		$yearModules = Database::Query( 'SELECT modules.moduleName, SUM( assignments.assignmentScore ) AS moduleScore, SUM( assignments.assignmentMarks ) AS moduleMarks FROM modules LEFT JOIN assignments ON assignments.assignmentModule = modules.moduleIdentifier LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier AND modules.moduleStart >= @startYear AND modules.moduleFinish <= @finishYear GROUP BY modules.moduleIdentifier ORDER BY moduleScore DESC;', [
			':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
		] );

		// Respond with an error if there are no modules for this year
		if ( $yearModules === false ) respondToRequest( StatusCode::Error, 'No modules for year ' . $courseYear, 500 );

		// Create an array in the results array to hold the module scores for this year
		// Minus 1 required because array indexing starts at 0, and starting at it 1 would turn it into an associative array
		$graphData[ 'moduleScores' ][ $courseYear - 1 ] = [];

		// Populate the module scores & marks in the above array with the results from the query
		foreach ( $yearModules as $module ) $graphData[ 'moduleScores' ][ $courseYear - 1 ][ $module[ 'moduleName' ] ] = [
			'score' => intval( $module[ 'moduleScore' ] ),
			'marks' => intval( $module[ 'moduleMarks' ] ),
		];

		/********** Average grade for each year of the course **********/

		// Fetch the average scores for this year of the user's course
		$yearAverages = Database::Query( 'SELECT ROUND( AVG( assignments.assignmentScore ), 2 ) AS averageScore, ROUND( AVG( assignments.assignmentMarks ), 2 ) AS averageMarks FROM modules LEFT JOIN assignments ON assignments.assignmentModule = modules.moduleIdentifier LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier AND modules.moduleStart >= @startYear AND modules.moduleFinish <= @finishYear;', [
			':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
		] );

		// Respond with an error if there is no average for this year
		if ( $yearAverages === false ) respondToRequest( StatusCode::Error, 'No average for year ' . $courseYear, 500 );

		// Create an array in the results array to hold the average scores for this year
		$graphData[ 'yearAverages' ][ $courseYear - 1 ] = [];

		// Populate the average scores in the above array with the results from the query
		// This converts to floats instead of integers because the average values could have decimal places
		foreach ( $yearAverages as $yearAverage ) $graphData[ 'yearAverages' ][ $courseYear - 1 ] = [
			'score' => floatval( $yearAverage[ 'averageScore' ] ),
			'marks' => floatval( $yearAverage[ 'averageMarks' ] ),
		];

	}

	/********** Module completion progress **********/

	// Fetch an array of modules and how many complete assignments they have by checking if the assignment score is greater than zero, along with the total number of assignments, ordered by the time the module is finished, taking into account the user's course
	$moduleCompletionProgress = Database::Query( 'SELECT modules.moduleName, SUM( IF( assignments.assignmentScore > 0, 1, 0 ) ) AS assignmentsComplete, COUNT( assignments.assignmentIdentifier ) AS assignmentsTotal FROM assignments LEFT JOIN modules ON modules.moduleIdentifier = assignments.assignmentModule LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier GROUP BY modules.moduleName ORDER BY modules.moduleFinish;', [
		':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
	] );

	// Respond with an error if there are no modules for the user's course
	if ( $moduleCompletionProgress === false ) respondToRequest( StatusCode::Error, 'No modules in course', 500 );

	// Populate the results array for module completion progress using the data from the query
	foreach ( $moduleCompletionProgress as $module ) $graphData[ 'moduleCompletionProgress' ][ $module[ 'moduleName' ] ] = [
		'complete' => intval( $module[ 'assignmentsComplete' ] ),
		'total' => intval( $module[ 'assignmentsTotal' ] )
	];

	/********** Modules & assignments for form comboboxes **********/

	// Fetch a list of all modules (identifier, name & finish date) and their assignments (identifier, name & due date) for the user's course
	$formModulesAssignments = Database::Query( 'SELECT modules.moduleIdentifier, modules.moduleName, UNIX_TIMESTAMP( modules.moduleFinish ) AS moduleFinish, assignments.assignmentIdentifier, assignments.assignmentName, UNIX_TIMESTAMP( assignments.assignmentDue ) AS assignmentDue, assignments.assignmentMarks FROM assignments LEFT JOIN modules ON modules.moduleIdentifier = assignments.assignmentModule LEFT JOIN courses ON courses.courseIdentifier = modules.moduleCourse LEFT JOIN users ON users.userCourse = courses.courseIdentifier WHERE users.userIdentifier = :userIdentifier ORDER BY modules.moduleFinish;', [
		':userIdentifier' => [ $_SESSION[ 'userIdentifier' ], PDO::PARAM_INT ]
	] );

	// Respond with an error if there are no modules/assignments for the user's course
	if ( $formModulesAssignments === false ) respondToRequest( StatusCode::Error, 'No modules or assignments for course', 500 );

	// Create an array to hold the modules and assignments for the form comboboxes
	$formData = [];

	// Loop through each row of the query result...
	foreach ( $formModulesAssignments as $moduleRow ) {

		// Skip this iteration if we've already added this module to the form data array
		if ( array_key_exists( $moduleRow[ 'moduleName' ], $formData ) ) continue;

		// Add this module's information and an empty assignments array to the form data array
		$formData[ $moduleRow[ 'moduleName' ] ] = [
			'identifier' => intval( $moduleRow[ 'moduleIdentifier' ] ),
			'finish' => intval( $moduleRow[ 'moduleFinish' ] ),
			'assignments' => []
		];

		// Loop through each row of the query result...
		foreach ( $formModulesAssignments as $assignmentRow ) {

			// Skip this iteration if it isn't for this iteration's module
			if ( $assignmentRow[ 'moduleIdentifier' ] !== $moduleRow[ 'moduleIdentifier' ] ) continue;

			// Add this assignment to the module's assignments array
			$formData[ $assignmentRow[ 'moduleName' ] ][ 'assignments' ][ $assignmentRow[ 'assignmentName' ] ] = [
				'identifier' => intval( $assignmentRow[ 'assignmentIdentifier' ] ),
				'due' => intval( $assignmentRow[ 'assignmentDue' ] ),
				'marks' => intval( $assignmentRow[ 'assignmentMarks' ] )
			];

		}

	}

	// Finally, respond with success containing the logged in user's name from the session, and the final collated graph data
	respondToRequest( StatusCode::Success, [
		'user' => [
			'name' => $_SESSION[ 'userName' ]
		],
		'graph' => $graphData,
		'form' => $formData,
	] );

}

// If this is a POST request...
elseif ( $_SERVER[ 'REQUEST_METHOD' ] === 'POST' ) {

	// Do not continue if the user is not logged in
	if ( !isUserLoggedIn() ) respondToRequest( StatusCode::UserNotLoggedIn );

	// If this request is for logging out the user...
	if ( isset( $_POST[ 'logout' ] ) && $_POST[ 'logout' ] == true ) {

		// Delete everything associated with the user's current session
		session_destroy();

		// Respond with success
		respondToRequest( StatusCode::Success );

	// If this request is for updating an assignment score...
	} else if ( isset( $_POST[ 'update' ] ) && $_POST[ 'update' ] == true ) {
		$assignmentIdentifier = $_POST[ 'assignment' ];
		$assignmentScore = $_POST[ 'score' ];

		if ( !isset( $assignmentIdentifier ) ) respondToRequest( StatusCode::AssignmentIdentifierEmpty );
		if ( !isset( $assignmentScore ) ) respondToRequest( StatusCode::AssignmentScoreEmpty );

		$scoreValidity = Database::Query( 'SELECT IF ( :userScore <= assignments.assignmentMarks, 1, 0 ) AS isScoreValid FROM assignments WHERE assignments.assignmentIdentifier = :assignmentIdentifier;', [
			':userScore' => [ $assignmentScore, PDO::PARAM_INT ],
			':assignmentIdentifier' => [ $assignmentIdentifier, PDO::PARAM_INT ]
		], true );

		if ( $scoreValidity === false ) respondToRequest( StatusCode::AssignmentIdentifierInvalid );
		if ( $scoreValidity[ 'isScoreValid' ] === 0 ) respondToRequest( StatusCode::AssignmentScoreInvalid );

		$updateAssignment = Database::Query( 'UPDATE assignments SET assignments.assignmentScore = :userScore WHERE assignments.assignmentIdentifier = :assignmentIdentifier;', [
			':userScore' => [ $assignmentScore, PDO::PARAM_INT ],
			':assignmentIdentifier' => [ $assignmentIdentifier, PDO::PARAM_INT ]
		] );

		respondToRequest( StatusCode::Success, $updateAssignment );

	// Respond with bad request for anything else...
	} else {
		respondToRequest( StatusCode::Error, null, 400 );
	}

}

?>
