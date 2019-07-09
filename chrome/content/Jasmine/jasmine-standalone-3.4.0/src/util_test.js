/*
 * Constructs the URI to archive a given resource.
 *
 * @param {string} uri: URI to original resource
 *
 * @return {string} URI to archive the original resource
 */

function constructUri(uri) {
  if (!uri || uri === "" || typeof uri != "string") {
    return null;
  }
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
  if ("withCredentials" in xhr && url) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.

    xhr.open(method, url, true);
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
  if (!responseText) {
    return null;
  }
  var redirIndex = responseText.indexOf("redirUrl");
  var start = responseText.indexOf("\"", redirIndex) + 1;
  var end = responseText.indexOf("\"", start);
  if (redirIndex === -1 || start === -1 || start >= responseText.length || end === -1) {
    return null;
  }
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

  // URLs to archived resources should always be of the form:
  // https://web.archive.org/web/(date-time of archival)/(URL of original resource).
  var pattern = /\/web\/[0-9]{4,14}\/http.+/
  return pattern.test(url);
}

function makeAnchorTag(url, archivedUrl, date) {
  return "<a href=\"" + url + "\" data-versionurl=\"" + archivedUrl + "\"" +
         "data-versiondate=\"2015-01-21\"> </a>";

}
/*
 * Creates a new note and attaches it to the given item to contain a link to the archived resource.
 *
 * @param {Zotero.Item} item: the library entry to be modified.
 * @param {string} cLoc: the value of the content-location header in the server response.
 * @param {string} loc: the value of the location-header in the server response.
 * @param {string} responseText: server response represented as text.
 *
 * @returns: nothing.
 */
function attachAnchorNote(item, cLoc, loc, responseText) {
  var ZoteroPane = Zotero.getActiveZoteroPane(); 
  var selectedItems = ZoteroPane.getSelectedItems(); 
  var item = selectedItems[0]; 
  var url = item.getField('url');
  var note = new Zotero.Item('note'); 
  if (loc) {
    if (isWellFormedUrl(loc)) {
      note.setNote(makeAnchorTag(url, loc)); 
    }
    else {
      note.setNote(makeAnchorTag(url, "https://web.archive.org" + 
                   extractUrl(responseText), null));
    }
    note.parentID = item.id; 
    item.saveTx();
  }
  else if (cLoc) {
    if (isWellFormedUrl(cLoc)) {
      note.setNote(makeAnchorTag(url, "http://web.archive.org" + cLoc, null));
    }
    else {
      note.setNote(makeAnchorTag(url, "https://web.archive.org" + 
                   extractUrl(responseText), null));
    }
    note.parentID = item.id; 
    item.saveTx();     
  }
  else {
    var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
    var notif = "Archive URL not found.";
    errorNotifWindow.changeHeadline(notif);
    errorNotifWindow.show();
    errorNotifWindow.startCloseTimer(8000);
    
  }
  
}

/*
 * Displays appropriate error window if there is an error with archiving a resource.
 *
 * @param {number} status: status code of a the server response.
 *
 * @return: nothing.
 */

function handleError(status) {
  var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
  var notif = "";

  switch (status) {
    case 401:
    case 403:
      notif = "No access to the requested resource.";
      break;
    case 404:
      notif = "Resource not found. Ensure URL is correct.";
      break;
    case 503:
    case 504:
      notif = "Internet Archive may be down. Try again later.";
      break;
    default:
      notif = "Error occurred. Try again later (Code " + status + ").";
  }
  errorNotifWindow.changeHeadline(notif);
  errorNotifWindow.show();
  errorNotifWindow.startCloseTimer(8000);
}

/*
 * Sets properties (ready state change callback, timeout callback, request headers) 
 * for the archive request.
 *
 * @param {Zotero.Item} item: selected item in the library to be archived.
 * @param {XMLHttpRequest} req: request to be modified.
 *
 * @return: nothing.
 */

function setRequestProperties(item, req) {
  req.setRequestHeader('origin', 'https://web.archive.org/');
  req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  req.timeout = 10000;
  req.ontimeout = function() {
    var timeoutNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
    timeoutNotifWindow.changeHeadline("Request timed out. Try again later/check the URL");
    timeoutNotifWindow.show();
    timeoutNotifWindow.startCloseTimer(8000);
  }
  req.onreadystatechange = function() {
    if (req.status == 200 && req.readyState == 4) {
      cLoc = req.getResponseHeader("content-location");
      loc = req.getResponseHeader("location");
      var responseText = req.responseText;
      attachAnchorNote(item, cLoc, loc, responseText);
    }
    else if (req.readyState == 4 && req.status != 200) {
      handleError(req.status);
    }
  }
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
  var fullURI = constructUri(item.getField('url'));
  var req = createCORSRequest("GET", fullURI);
  setRequestProperties(item, req);
  req.send();
}
