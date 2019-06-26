/*
 * TODO: Add wrapper callback function that uses the result of push() and parseResponse() 
 * to create item in Zotero with the given archived link...  
 */

function pushLinkToZotero() {

}

/*
 * Creates URL to send request to, in order to archive the URI passed in.
 *
 * @param uri: URI of page to archive
 * @return: modified URI to archive the passed in URI.
 */

function constructURI(uri) {
	return "https://web.archive.org/save/" + uri;
}
/* TODO: Get rid of console.log's and replace with returns
 *
 * Parses server response to find URL of archived resource.
 *
 * @param response: Server response as text
 * @return: URI of the archived version of the webpage.
 */
function parseResponse(error, response, body) {
	locationField = response.caseless.get("Location");
	contentLocationField = response.caseless.get("Content-Location");
	if (error) {
		console.log(error);
	}
	else if (response && locationField) {
		console.log(locationField);
	}
	else if (response && contentLocationField) {
		archivedUri = "https://web.archive.org" + contentLocationField;
		console.log(archivedUri);
	}
	else {
		console.log("Cannot be archived");
	}
}

/*
 * Pushes a given webpage to the Internet Archive.
 * 
 * @param uri: URI of the page to archive
 * @return: URI of the archived version of the webpage.
 */
function push(uri) {
	var req = require('request');
	const init = {
		method: 'GET',
		uri: constructURI(uri),
	};
	req(init, parseResponse);
}



push("https://stackoverflow.com/questions/4114095/how-do-i-revert-a-git-repository-to-a-previous-commit");