
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
		return error;
	}
	else if (response && locationField) {
		return locationField;
	}
	else if (response && contentLocationField) {
		archivedUri = "https://web.archive.org" + contentLocationField;
		return archivedUri;
	}
	else {
		return -1;
	}
}





