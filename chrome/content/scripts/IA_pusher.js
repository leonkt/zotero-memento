/*
 * Creates URL to send request to, in order to archive the URI passed in.
 *
 * @param uri: URI of page to archive
 * @return: modified URI to archive the passed in URI.
 */

function constructURI(uri) {
	return "https://web.archive.org/save/" + uri;
}
/*
 * Parses server response to find URL of archived resource.
 *
 * @param response: Server response as text
 * @return: URI of the archived version of the webpage.
 */
function parseResponse(response) {
	locationField = response.caseless.get("Location");
	contentLocationField = response.caseless.get("Content-Location");
	if (response && locationField) {
		return locationField;
	}
	else if (response && contentLocationField) {
		archivedUri = "https://web.archive.org" + contentLocationField;
		return archivedUri;
	}
	else {
		return "Cannot be archived";
	}
}

/*
 * Pushes a given webpage to the Internet Archive.
 * 
 * @param uri: URI of the page to archive
 * @return: URI of the archived version of the webpage.
 */
async function push(uri) {
	var req = require('request');
	const init = {
		method: 'GET',
		uri: constructURI(uri),
		resolveWithFullResponse: true
	};
	req(init);
}



push("https://jefferson.sgusd.k12.ca.us/");