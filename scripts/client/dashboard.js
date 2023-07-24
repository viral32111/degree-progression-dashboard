/*
 This script is for loading the dashboard charts, checking if the user
 is logged in, and handling any other dashboard-related functionality.
*/

// Store all page elements in variables for quick access
const container = document.getElementById( "container" );

const titleUserName = document.getElementById( "title-user-name" );
const titleLogoutLink = document.getElementById( "title-logout-link" );

const nextAssignmentRow = document.getElementById( "next-assignment-row" );
const nextAssignmentName = document.getElementById( "next-assignment-name" );
const nextAssignmentDue = document.getElementById( "next-assignment-due" );
const nextAssignmentModule = document.getElementById( "next-assignment-module" );

const graphYearModuleScores = [ document.getElementById( "graph-first-year-module-scores" ), document.getElementById( "graph-second-year-module-scores" ) ];
const graphYearAverageGrades = [ document.getElementById( "graph-first-year-average-grade" ), document.getElementById( "graph-second-year-average-grade" ) ];
const graphModuleCompletionProgress = document.getElementById( "graph-module-completion-progress" );
const graphRandomModuleScores = document.getElementById( "graph-random-module-scores" );

const updateForm = document.getElementById( "update-form" );
const updateFormModule = document.getElementById( "update-form-module" );
const updateFormAssignment = document.getElementById( "update-form-assignment" );
const updateFormScore = document.getElementById( "update-form-score" );
const updateFormSubmit = document.getElementById( "update-form-submit" );

// Create an array holding the default hexadecimal colors that Bootstrap uses for custom chart styling (getbootstrap.com/docs/5.0/utilities/colors/#variables)
const bootstrapDefaultColors = [
	"0d6efd", "dc3545",
	"fd7e14", "ffc107",
	"198754", "d63384",
	"20c997", "6610f2",
	"6f42c1", "0dcaf0"
];

// The hexadecimal colors to use for unsubmitted assignments/incomplete modules on the graphs, and for help text on the graphs
const nonSubmitColor = "dddddd";
const graphHelpTextColor = "#666666";

// An empty object that will contain each assignment for each module for looking up when the user selects a module on the update form
const moduleAssignments = {};

// A helper function to toggle the update form inputs
const setUpdateFormLoading = ( isLoading ) => {

	// Enable or disable the form inputs
	updateFormModule.disabled = isLoading;
	updateFormAssignment.disabled = isLoading;
	updateFormScore.disabled = isLoading;
	updateFormSubmit.disabled = isLoading;

	// Unfocus the form inputs
	if ( isLoading === true ) {
		updateFormModule.blur();
		updateFormAssignment.blur();
		updateFormScore.blur();
	}

}

// A function for fetching data from the dashboard API and updating all the graphs on the page
const updateGraphs = async ( isRefresh = false ) => {

	// Strictly ensure that the is refresh parameter is a boolean (page load event passes Event object as the first parameter)
	if ( isRefresh !== true ) isRefresh = false;

	// Fetch the graph data from the server script
	const apiResponse = await fetch( "scripts/server/api/dashboard.php", {
		method: "GET"
	} );

	// If the request was unsuccessful then create a new exception with the server response
	if ( !apiResponse.ok ) throw new Error( ( await apiResponse.text() ) );

	// Parse the response as JSON
	const apiResponseData = await apiResponse.json();

	// If all goes well and we have the data for the graphs...
	if ( apiResponseData[ "status" ] === 0 ) {

		// Update the user's name on the subtitle
		titleUserName.innerText = apiResponseData[ "data" ][ "user" ][ "name" ];

		/********** Next assignment due **********/

		// Update the next assignment due alert if applicable, otherwise remove the alert (they have no assignment due)
		const nextAssignmentDueData = apiResponseData[ "data" ][ "graph" ][ "nextAssignmentDue" ]
		if ( nextAssignmentDueData ) {
			nextAssignmentName.innerText = nextAssignmentDueData[ "name" ];
			nextAssignmentDue.innerText = nextAssignmentDueData[ "due" ];
			nextAssignmentModule.innerText = nextAssignmentDueData[ "module" ];
		} else {
			nextAssignmentRow.remove();
		}

		// Load the Google Charts API with the default charts package, and execute a callback once that is done
		google.charts.load( "current", { "packages": [ "corechart" ] } );
		google.charts.setOnLoadCallback( () => {

			/********** Random module scores **********/

			// If we have got random module scores...
			const randomModuleScoresData = apiResponseData[ "data" ][ "graph" ][ "randomModuleScores" ];
			if ( randomModuleScoresData ) {
	
				// Create and initialise the datatable for the graph with the necessary columns
				const pieChartSlices = [];
				const pieChartData = new google.visualization.DataTable();
				pieChartData.addColumn( { type: "string", label: "Assignment" } );
				pieChartData.addColumn( { type: "number", label: "Score" } );
				pieChartData.addColumn( { type: "string", role: "tooltip" } );

				// Loop through each assignment and store its name, score and marks...
				for ( const assignmentName in randomModuleScoresData[ "assignments" ] ) {
					const assignmentScore = randomModuleScoresData[ "assignments" ][ assignmentName ][ "score" ];
					const assignmentMarks = randomModuleScoresData[ "assignments" ][ assignmentName ][ "marks" ];

					// If the assignment score is zero, then use the total available marks as the score, set the color to gray, add a notice on the tooltip
					if ( assignmentScore === 0 ) {
						pieChartData.addRow( [
							assignmentName,
							assignmentMarks,
							assignmentName + "\n\nThis assignment has not been submitted yet.\nThe value shown on the chart is the available marks.",
						] );

						pieChartSlices.push( { color: nonSubmitColor } );

					// Otherwise use the assignment score as the score, set the color to something nice, add the score on the tooltip
					} else {
						pieChartData.addRow( [
							assignmentName,
							assignmentScore,
							assignmentName + "\nScore: " + assignmentScore + "/" + assignmentMarks + " (" + Math.floor( ( assignmentScore / assignmentMarks ) * 100 ) + "%)"
						] );

						pieChartSlices.push( { color: bootstrapDefaultColors[ Object.keys( randomModuleScoresData[ "assignments" ] ).indexOf( assignmentName ) ] } );
					}
				}

				// Create a new pie chart
				const pieChart = new google.visualization.PieChart( graphRandomModuleScores );

				// Add an event listener to the chart to customise the text positions once it is rendered
				google.visualization.events.addListener( pieChart, "ready", () => {

					// Fetch the chart elements
					const chartSVG = graphRandomModuleScores.querySelector( "div div div svg" );
					const titleText = chartSVG.querySelector( "g text" );

					// Create two new text elements by copying the original title element
					const moduleText = titleText.cloneNode( true );
					const helpText = titleText.cloneNode( true );

					// Add a rounded border to this chart (has to be done here instead of in the HTML classes because the chart has a background and would hide those borders)
					chartSVG.classList.add( "border", "rounded" );

					// Set the position of the title
					titleText.setAttribute( "y", "18" );
					titleText.setAttribute( "x", "20" );

					// Set the position, color and text of the help text
					helpText.setAttribute( "y", "200" );
					helpText.setAttribute( "x", "24" );
					helpText.setAttribute( "fill", graphHelpTextColor );
					helpText.innerHTML = "Any sections in gray have not been submitted yet.";

					// Set the position, color and text of the module name text
					moduleText.setAttribute( "fill", "#333333" );
					moduleText.setAttribute( "x", "20" );
					moduleText.setAttribute( "y", "33" );
					moduleText.setAttribute( "font-style", "italic" );
					moduleText.innerHTML = "(" + randomModuleScoresData[ "module" ] + ")";

					// Add the new text elements to the chart
					titleText.parentNode.appendChild( moduleText );
					titleText.parentNode.appendChild( helpText );

				} );

				// Draw the chart using the above data and the options below
				pieChart.draw( pieChartData, {

					// Customised title with font matching the rest of the page
					title: "Your scores for a random module on your course.",
					titleTextStyle: {
						fontName: "Helvetica", // getbootstrap.com/docs/5.0/content/reboot/#native-font-stack
						fontSize: 12,
						bold: false
					},

					// Custom slice colors and values
					slices: pieChartSlices,
					pieSliceText: "value",
					pieSliceTextStyle: {
						fontSize: 12
					},

					// Disable the legend
					legend: {
						position: "none"
					},

					// Make it occupy all available space in the box
					width: "100%",
					height: "100%",
					chartArea: {
						top: "20%",
						left: "5%",
						width: "90%",
						height: "65%"
					}

				} );

			}

			/********** Module scores for each year **********/

			// If we've got per-module score data
			const moduleScoreData = apiResponseData[ "data" ][ "graph" ][ "moduleScores" ];
			if ( moduleScoreData ) {

				// Create two new datatables for both the 1st and 2nd year of the course
				const barChartData = [ new google.visualization.DataTable(), new google.visualization.DataTable() ];

				// Loop through each year of the course...
				for ( let courseYear = 0; courseYear < moduleScoreData.length; courseYear++ ) {

					// Populate this year's datatable with appropriate columns
					barChartData[ courseYear ].addColumn( { type: "string", label: "Module" } );
					barChartData[ courseYear ].addColumn( { type: "number", label: "Score" } );
					barChartData[ courseYear ].addColumn( { type: "string", role: "tooltip" } );
					barChartData[ courseYear ].addColumn( { type: "string", role: "style" } );
					barChartData[ courseYear ].addColumn( { type: "string", role: "annotation" } );

					// Loop through each module for this year...
					for ( const moduleName in moduleScoreData[ courseYear ] ) {
						const moduleScore = moduleScoreData[ courseYear ][ moduleName ][ "score" ];
						const moduleMarks = moduleScoreData[ courseYear ][ moduleName ][ "marks" ];

						// If this module's total score is zero then use the total available marks as the score, color it gray, and add an appropriate tooltip
						if ( moduleScore === 0 ) {
							barChartData[ courseYear ].addRow( [
								moduleName,
								moduleMarks,
								moduleName + "\n\nThis module has not had any assignments submitted yet.\nThe value shown on the chart is the available marks.",
								nonSubmitColor,
								"N/A"
							] );

						// Otherwise if the module's score is fine then use it, color it nicely and add a tooltip with the score data
						} else {
							barChartData[ courseYear ].addRow( [
								moduleName,
								moduleScore,
								moduleName + "\nScore: " + moduleScore + "/" + moduleMarks + " (" + Math.floor( ( moduleScore / moduleMarks ) * 100 ) + "%)",
								bootstrapDefaultColors[ Object.keys( moduleScoreData[ courseYear ] ).indexOf( moduleName ) ],
								moduleScore.toString()
							] );
						}

					}

					// Create a bar chart for this year
					const barChart = new google.visualization.BarChart( graphYearModuleScores[ courseYear ] );

					// Add an event listener for customising the text that runs whenever the chart finishes rendering
					google.visualization.events.addListener( barChart, "ready", () => {

						// Get the chart's text elements
						const chartSVG = graphYearModuleScores[ courseYear ].querySelector( "div div div svg" );
						const titleText = chartSVG.querySelector( "g text" );

						// Create a new text element by copying the title
						const helpText = titleText.cloneNode( true );

						// Add a border to this chart
						chartSVG.classList.add( "border", "rounded" );

						// Set the color of the help text
						helpText.setAttribute( "fill", graphHelpTextColor );

						// Set the horizontal position of the help text and text content based on if this is the 1st or 2nd year
						if ( courseYear === 0 ) {
							helpText.setAttribute( "x", "620" );
							helpText.innerHTML = "These are ordered from highest to lowest achieved score.";
						} else if ( courseYear === 1 ) {
							helpText.setAttribute( "x", "590" );
							helpText.innerHTML = "Modules in gray have not had any assignment submissions yet.";
						}

						// Add the help text to the chart
						titleText.parentNode.appendChild( helpText );

					} );

					// Draw the chart using the data above and options below
					barChart.draw( barChartData[ courseYear ], {

						// Custom title
						title: "These are the scores you achieved in each module, for the " + ( courseYear === 0 ? "first" : "second" ) + " year of your course.",
						titleTextStyle: {
							fontName: "Helvetica",
							fontSize: 12,
							bold: false,
						},

						// Make it a horizontal chart
						bars: "horizontal",

						// Disable axis labels and the legend
						vAxis: { textPosition: "none" },
						legend: { position: "none" },

						// Make it use up all the available space in the box
						width: "100%",
						height: "100%",
						chartArea: {
							left: "1.75%",
							width: "96%"
						}

					} );

				}

			}

			/********** Average grades for each year **********/

			// If we have the average grades for each year...
			const yearAverageData = apiResponseData[ "data" ][ "graph" ][ "yearAverages" ];
			if ( yearAverageData ) {

				// Create an array holding two datatables for each year
				const donutChartData = [ new google.visualization.DataTable(), new google.visualization.DataTable() ];

				// Loop through each year of the course...
				for ( let courseYear = 0; courseYear < yearAverageData.length; courseYear++ ) {
					const yearAverage = yearAverageData[ courseYear ];

					// Add the necessary columns to the datatable
					donutChartData[ courseYear ].addColumn( { type: "string", label: "Text" } );
					donutChartData[ courseYear ].addColumn( { type: "number", label: "Score" } );
					donutChartData[ courseYear ].addColumn( { type: "string", role: "tooltip" } );

					// Add the average total available marks
					donutChartData[ courseYear ].addRow( [
						Math.round( yearAverage[ "marks" ] ).toString(),
						yearAverage[ "marks" ],
						"Average available marks: " + yearAverage[ "marks" ]
					] );

					// Add the average achieved score
					donutChartData[ courseYear ].addRow( [
						Math.round( yearAverage[ "score" ] ).toString(),
						yearAverage[ "score" ],
						"Average achieved score: " + yearAverage[ "score" ] + "/" + yearAverage[ "marks" ] + " (" + Math.floor( ( yearAverage[ "score" ] / yearAverage[ "marks" ] ) * 100 ) + "%)"
					] );

					// Create a pie chart with a hole in the middle
					const donutChart = new google.visualization.PieChart( graphYearAverageGrades[ courseYear ] );

					// Add an event listener for customising the text that runs whenever the chart finishes rendering
					google.visualization.events.addListener( donutChart, "ready", () => {

						// Get the chart's text elements
						const chartSVG = graphYearAverageGrades[ courseYear ].querySelector( "div div div svg" );
						const titleText = chartSVG.querySelector( "g text" );
						const helpText = titleText.cloneNode( true );

						// Add a border to this chart
						chartSVG.classList.add( "border", "rounded" );

						// Set the vertical position and color of the help text
						helpText.setAttribute( "y", "138" );
						helpText.setAttribute( "fill", graphHelpTextColor );

						// Set the title position & help text based on what course year this is
						if ( courseYear === 0 ) {
							titleText.setAttribute( "x", "40" );

							helpText.setAttribute( "x", "20" );
							helpText.innerHTML = "The closer to 50%, the closer to the highest grade.";
						} else if ( courseYear === 1 ) {
							titleText.setAttribute( "x", "30" );

							helpText.setAttribute( "x", "27" );
							helpText.innerHTML = "Average may be low due to incomplete modules.";
						}

						// Add the help text to the chart
						titleText.parentNode.appendChild( helpText );

					} );

					// Draw the chart using the data above and options below
					donutChart.draw( donutChartData[ courseYear ], {

						// Custom title
						title: "Your average grade for the " + ( courseYear === 0 ? "first" : "second" ) + " course year.",
						titleTextStyle: {
							fontName: "Helvetica",
							fontSize: 12,
							bold: false,
						},

						// Donut hole size and slice text
						pieHole: 0.3,
						pieSliceTextStyle: { color: "ffffff" },
						pieSliceText: "label",

						// Disable the legend
						legend: { position: "none" },

						// Make it use up all the available space in the box
						width: "100%",
						height: "100%",
						chartArea: {
							left: "5%",
							width: "90%"
						}

					} );

				}

			}

			/********** Module completion progress **********/

			// If we have the module completion progress...
			const moduleCompletionProgressData = apiResponseData[ "data" ][ "graph" ][ "moduleCompletionProgress" ];
			if ( moduleCompletionProgressData ) {

				// Create a datatable for this chart
				const columnChartData = new google.visualization.DataTable();

				// Add the main column to the datatable for the module's name
				columnChartData.addColumn( { type: "string", label: "Module" } );

				// Add the columns to the datatable for completion progress
				columnChartData.addColumn( { type: "number", label: "Complete" } );
				columnChartData.addColumn( { type: "string", role: "style" } );
				columnChartData.addColumn( { type: "string", role: "annotation" } );

				// Add the columns to the datatable for total progress
				columnChartData.addColumn( { type: "number", label: "Total" } );
				columnChartData.addColumn( { type: "string", role: "style" } );

				// Loop through each module...
				for ( const moduleName in moduleCompletionProgressData ) {
					const assignmentsComplete = moduleCompletionProgressData[ moduleName ][ "complete" ];
					const assignmentsTotal = moduleCompletionProgressData[ moduleName ][ "total" ];

					// Add the number of assignments complete and total number of assignments to the datatable, along with an informative tooltip
					columnChartData.addRow( [
						moduleName,

						assignmentsComplete,
						"198754", // Bootstrap color code for green
						Math.floor( ( assignmentsComplete / assignmentsTotal ) * 100 ) + "%",

						assignmentsTotal,
						nonSubmitColor
					] );

				}

				// Create a column chart
				const columnChart = new google.visualization.ColumnChart( graphModuleCompletionProgress );

				// Add an event listener for customising the text that runs whenever the chart finishes rendering
				google.visualization.events.addListener( columnChart, "ready", () => {

					// Get the chart's text elements
					const chartSVG = graphModuleCompletionProgress.querySelector( "div div div svg" );
					const titleText = chartSVG.querySelector( "g text" );

					// Create two new text elements by copying the title
					const helpText = titleText.cloneNode( true );
					const orderText = titleText.cloneNode( true );

					// Add a border to this chart
					chartSVG.classList.add( "border", "rounded" );

					// Set the horizontal position of the title to centre it
					titleText.setAttribute( "x", "27" );

					// Set the position, color and content of the help text
					helpText.setAttribute( "x", "508" );
					helpText.setAttribute( "fill", graphHelpTextColor );
					helpText.innerHTML = "Green represents assignments completed, gray represents total assignments.";

					// Set the position, color and content of the ordered by text
					orderText.setAttribute( "x", "592" );
					orderText.setAttribute( "y", "37" );
					orderText.setAttribute( "fill", graphHelpTextColor );
					orderText.innerHTML = "This is ordered by the finish date of the module from right to left.";

					// Add both new text elements to the graph
					titleText.parentNode.appendChild( helpText );
					titleText.parentNode.appendChild( orderText );
				} );

				// Draw the chart using the data above and options below
				columnChart.draw( columnChartData, {

					// Custom title
					title: "This is the progress of assignments completed for each module on your course.",
					titleTextStyle: {
						fontName: "Helvetica",
						fontSize: 12,
						bold: false,
					},

					// Disable color previews on the tooltip
					tooltip: {
						showColorCode: false
					},

					// Show percentages above the columns
					annotations: {
						alwaysOutside: true
					},

					// Treat the columns as one
					focusTarget: "category",

					// Make the bars vertical
					bars: "vertical",

					// Disable the horizontal axis labels
					hAxis: {
						textPosition: "none"
					},

					// Customise the verical axis
					vAxis: {
						format: "0", // Disable decimals (stackoverflow.com/a/55982414)
						viewWindow: {
							min: 0,
							max: 4.3 // Bit of room above the graph
						},
						minorGridlines: {
							color: "transparent" // Hide decimal gridlines
						}
					},

					// Hide the legend
					legend: {
						position: "none"
					},

					// Make the chart use all the room inside the box
					width: "100%",
					height: "100%",
					chartArea: {
						top: "8%",
						left: "3%",
						width: "95%",
						height: "88%"
					}

				} );

			}

		} );

		// Store the current unix timestamp in seconds
		const currentUnixTime = Math.floor( Date.now() / 1000 );

		// If we have got data for populating the form, and this is not a refresh...
		const formData = apiResponseData[ "data" ][ "form" ];
		if ( formData && !isRefresh ) {

			// Clear all existing options from the module selection
			while ( updateFormModule.firstChild ) updateFormModule.removeChild( updateFormModule.lastChild );

			// Loop through each module in the form data...
			for ( const moduleName in formData ) {
				const module = formData[ moduleName ];

				// Create a new HTML select option with this module's name and identifier
				const moduleOption = document.createElement( "option" );
				moduleOption.value = module[ "identifier" ];
				moduleOption.innerHTML = moduleName;
				
				// If this module has finished already then disable the option and give it an appropriate tooltip
				if ( currentUnixTime > module[ "finish" ] ) {
					moduleOption.disabled = true;
					moduleOption.innerHTML += " (Finished)";
					moduleOption.title = "This module finished on " + new Date( module[ "finish" ] * 1000 ).toLocaleString() + ".";
				}

				// Add this option to the selection
				updateFormModule.appendChild( moduleOption );

				// Add this module to the lookup table for later use
				moduleAssignments[ module[ "identifier" ] ] = {};

				// Loop through each assignment in this module...
				for ( const assignmentName in module[ "assignments" ] ) {
					const assignment = module[ "assignments" ][ assignmentName ];

					// Add this assignment to the lookup table for later use
					moduleAssignments[ module[ "identifier" ] ][ assignment[ "identifier" ] ] = {
						name: assignmentName,
						due: assignment[ "due" ],
						marks: assignment[ "marks" ],
					};

				}

			}

			// Manually call the selection changed event for the module selection so that it populates the assignment selection (www.fwait.com/how-to-trigger-select-change-event-in-javascript/)
			updateFormModule.dispatchEvent( new Event( "change" ) );

		}

		// Make the dashboard visible if this is not a refresh
		if ( !isRefresh ) container.classList.remove( "invisible" );

	// Redirect to the login page if we are not logged in and this is not a refresh
	} else if ( apiResponseData[ "status" ] === 6 && !isRefresh ) {
		window.location.href = "login.html";
	
	// Otherwise, throw an error because we did not expect this status code
	} else {
		throw new Error( "Unexpected status code: " + apiResponseData[ "status" ] );
	}
}

// Add an event listener to run asyncronously whenever the logout link is clicked
titleLogoutLink.addEventListener( "click", async ( event ) => {

	// Prevent the default redirect action
	event.preventDefault();

	// Send a request to the serverside dashboard script to logout the user
	const apiResponse = await fetch( "scripts/server/api/dashboard.php", {
		method: "POST",
		body: new URLSearchParams( {
			"logout": true
		} )
	} );

	// If the request was unsuccessful then create a new exception with the server response
	if ( !apiResponse.ok ) throw new Error( ( await apiResponse.text() ) );

	// Parse the response as JSON
	const apiResponseData = await apiResponse.json();

	// Redirect to the login page if successful or we are (somehow) not logged in
	if ( apiResponseData[ "status" ] === 0 || apiResponseData[ "status" ] === 6 ) {
		window.location.href = "login.html";

	// Otherwise, throw an error because we did not expect this status code for logging out
	} else {
		throw new Error( "Unexpected status code: " + apiResponseData[ "status" ] );
	}

} );

// Add an event listener to run syncronously whenever the module selection changes
updateFormModule.addEventListener( "change", () => {

	// Store the current unix timestamp in seconds
	const currentUnixTime = Math.floor( Date.now() / 1000 );

	// Clear all existing options from the assignment selection
	while ( updateFormAssignment.firstChild ) updateFormAssignment.removeChild( updateFormAssignment.lastChild );
	
	// Loop through each assignment in the lookup table for the selected module...
	for ( assignmentIdentifier in moduleAssignments[ updateFormModule.value ] ) {
		const assignment = moduleAssignments[ updateFormModule.value ][ assignmentIdentifier ];

		// Create a new HTML select option with this assignment's name and identifier
		const assignmentOption = document.createElement( "option" );
		assignmentOption.value = assignmentIdentifier;
		assignmentOption.innerHTML = assignment.name

		// If this assignment has passed its submission time then disable the option and give it an appropriate tooltip
		if ( currentUnixTime > assignment.due ) {
			assignmentOption.disabled = true;
			assignmentOption.innerHTML += " (Submitted)";
			assignmentOption.title = "This assignment was submitted on " + new Date( assignment.due * 1000 ).toLocaleString() + ".";
		}

		// Add this assignment option to the selection box
		updateFormAssignment.appendChild( assignmentOption );

	}

	// Manually trigger the assignment selection changed event so that it updates the score input placeholder
	updateFormAssignment.dispatchEvent( new Event( "change" ) );

} );

// Add an event listener to run syncronously whenever the assignment selection changes
updateFormAssignment.addEventListener( "change", () => {
	const assignment = moduleAssignments[ updateFormModule.value ][ updateFormAssignment.value ];

	// Update the score input placeholder and maximum allowed value to reflect the selected assignment's available marks
	updateFormScore.placeholder = "Score out of " + assignment.marks + "...";
	updateFormScore.max = assignment.marks;

} );

// Add an event listener to run asyncronously whenever the update form is submitted
updateForm.addEventListener( "submit", async ( event ) => {

	// Prevent the default form submission action
	event.preventDefault();

	// Disable and unfocus the form inputs
	setUpdateFormLoading( true );

	// Remove the green color from the submit button
	updateFormSubmit.classList.remove( "btn-success" );

	// Get the selected assignment using the lookup table
	const assignment = moduleAssignments[ updateFormModule.value ][ updateFormAssignment.value ];

	// If this assignment has passed its submission time then error and the user they cannot submit it
	if ( Math.floor( Date.now() / 1000 ) > assignment.due ) {
		updateFormSubmit.classList.add( "btn-danger" );
		updateFormSubmit.innerText = "Cannot update an old assignment!";

	// Otherwise, continue...
	} else {

		// Send a request to the serverside dashboard API script to update the selected assignment with the provided score
		const apiResponse = await fetch( "scripts/server/api/dashboard.php", {
			method: "POST",
			body: new URLSearchParams( {
				"update": true,
				"assignment": updateFormAssignment.value,
				"score": updateFormScore.value
			} )
		} );
	
		// If the request was unsuccessful then error with the server response
		if ( !apiResponse.ok ) throw new Error( ( await apiResponse.text() ) );
	
		// Parse the API response as JSON
		const apiResponseData = await apiResponse.json();
	
		// Check the serverside api.php script for a list of available status codes
	
		// If the request was successful...
		if ( apiResponseData[ "status" ] === 0 ) {

			// Set the submit button color to blue and indicate to the user that the update was successful
			updateFormSubmit.classList.add( "btn-primary" );
			updateFormSubmit.innerText = "Successfully updated assignment score!";
	
			// Refresh all the graphs
			await updateGraphs();
	
		// If the assignment identifier was empty then error and inform the user
		} else if ( apiResponseData[ "status" ] === 10 ) {
			updateFormSubmit.classList.add( "btn-danger" );
			updateFormSubmit.innerText = "No assignment selected!";
	
		// If the assignment score was empty then error and inform the user
		} else if ( apiResponseData[ "status" ] === 11 ) {
			updateFormSubmit.classList.add( "btn-danger" );
			updateFormSubmit.innerText = "No score provided!";
	
		// If the assignment identifier was invalid then error and inform the user
		} else if ( apiResponseData[ "status" ] === 12 ) {
			updateFormSubmit.classList.add( "btn-danger" );
			updateFormSubmit.innerText = "Unknown assignment selected!";
	
		// If the assignment score was invalid then error and inform the user
		} else if ( apiResponseData[ "status" ] === 13 ) {
			updateFormSubmit.classList.add( "btn-danger" );
			updateFormSubmit.innerText = "Score too high for that assignment!";
	
		// Display a warning and redirect to the login page if we are (somehow) not logged in
		} else if ( apiResponseData[ "status" ] === 6 ) {
			updateFormSubmit.classList.add( "btn-warning" );
			updateFormSubmit.innerText = "You are not logged in!";

			window.location.href = "login.html";
	
		// Otherwise, throw an error because we did not expect this status code for updating
		} else {
			throw new Error( "Unexpected status code: " + apiResponseData[ "status" ] );
		}

	}

	// Pause for a moment by promisifying the timeout function so the user has time to read the feedback
	await new Promise( ( resolve ) => setTimeout( resolve, 3000 ) );

	// Restore the submit button back to its default state
	updateFormSubmit.classList.remove( "btn-danger", "btn-primary", "btn-warning" );
	updateFormSubmit.classList.add( "btn-success" );
	updateFormSubmit.innerText = "Update";

	// Clear the score input
	updateFormScore.value = "";

	// Re-enable the form inputs
	setUpdateFormLoading( false );

} );

// Add an event listener to call the fetch and show graphs function whenever the page finishes loading
window.addEventListener( "load", updateGraphs );
