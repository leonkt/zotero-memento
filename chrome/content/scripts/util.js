/*
 * Constructs the URI to archive a given resource.
 *
 * @param {string} uri: URI to original resource
 *
 * @return {string} URI to archive the original resource
 */

function constructURI(uri) {
  // cors-anywhere is a proxy that adds a CORS header to the request
  return 'https://cors-anywhere.herokuapp.com/https://web.archive.org/save/' + uri;
}

/*
 * Creates a CORS request with cross-browser compatibility.
 *
 * @param {string} method: HTTP method for request.
 * @param {string} url: URL to a given resource.
 *
 * @return {XMLHttpRequest} appropriate HTTP request to url.
 */

function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } 
  else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } 
  else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}

/*
 * Extracts the URL from the server response if a well-formed one cannot be found from the 
 * location or content-location headers.
 *
 * @param {string} responseText: server response represented as text.
 *
 * @return {string}: well-formed part of URL to access the archived resource.
 */

function extractUrl(responseText) {
  var start = responseText.indexOf("redirUrl") + 12;
  var end = responseText.indexOf("\"", start)
  return responseText.slice(start, end);
}

/*
 * Makes sure that portion of the URL following the first "/" is representative of an 
 * archived resource.
 *
 * @param {string} url: part of the URL to check.
 *
 * @return {boolean}: whether url matches the given pattern.
 */
function isWellFormedUrl(url) {
  var pattern = /\/web\/[0-9]+\/.+/
  return pattern.test(url);
}

/*
 * Modifies the "extra" field of the given item to contain a link to the archived resource.
 *
 * @param {Zotero.Item} item: the library entry to be modified.
 * @param {string} cLoc: the value of the content-location header in the server response.
 * @param {string} loc: the value of the location-header in the server response.
 * @param {string} responseText: server response represented as text.
 *
 * @returns: nothing.
 */
function modifyExtra(item, cLoc, loc, responseText) {
  if (loc) {
    if (isWellFormedUrl(loc)) {
      item.setField("extra", "Archived Link: " + loc);
    }
    else {
      item.setField("extra", "Archived Link: https://web.archive.org" + 
                    extractUrl(responseText));
    }
  }
  else if (cLoc) {
    if (isWellFormedUrl(cLoc)) {
      item.setField("extra",  "Archived Link: http://web.archive.org" + cLoc);
    }
    else {
      item.setField("extra", "Archived Link: " + 'https://web.archive.org' + 
                    extractUrl(responseText));
    }
        
  }
  else {
    item.setField("extra", "Archive URL not found.");
  }
  item.saveTx();
}

function handleError() {

}
/*
 * Sends the request to archive a given resource. Sets the content of the extra field
 * to reflect the link to the archived version of the resource. 
 * 
 * @return: nothing
 */

function sendReq() {  
  var pane = Zotero.getActiveZoteroPane();
	var selectedItems = pane.getSelectedItems();
	var item = selectedItems[0];
	var partialURI = item.getField('url');
	var fullURI = constructURI(partialURI);
  var req = createCORSRequest("GET", fullURI);
  req.setRequestHeader('origin', 'https://web.archive.org/');
  req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  req.onreadystatechange = function() {
    if (req.status == 200 && req.readyState == 4) {
      cLoc = req.getResponseHeader("content-location");
      loc = req.getResponseHeader("location");
      var responseText = req.responseText;
      modifyExtra(item, cLoc, loc, responseText);
    }
    else if (req.status != 200) {
      // Popup that says failed to archive in the IA
      //handleError();
    }
  }
  req.send();
}
