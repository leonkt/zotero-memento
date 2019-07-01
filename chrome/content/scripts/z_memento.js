
/*
 * Constructs the URI to archive a given resource.
 *
 * @param {string} uri: URI to original resource
 *
 * @return {string} URI to archive the original resource
 */

function constructURI(uri) {
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
  //var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
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
 * Sends the request to archive a given resource.
 *
 * @param {string} uri: URI to the original resource
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
            if (cLoc) {
            	item.setField("extra", "Archived Link: http://web.archive.org" + cLoc);
            }
            else if (loc) {
            	item.setField("extra", "Archived Link:" + loc);
            }
            else {
            	item.setField("extra", "Cannot archive page at this time. Please try again later.");
            }
            item.save();
        }
    }
    req.send();

}

