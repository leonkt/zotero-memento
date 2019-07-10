var IAPusher = new function() {
    /*
     * Indicates whether an item has an "archived" tag or not.
     *
     * @param {Zotero.Item} item: item to be checked.
     *
     * @return {Boolean}: true if item has "archived" tag. Returns false otherwise.
     */

    this.isArchived = function(item) {
      var tags = item.getTags();
      for (i = 0; i < tags.length; i++) {
        if (tags[i.toString()]["tag"] === "archived") {
          return true;
        }
      }
      return false;
    };

    /*
     * Constructs the URI to archive a given resource.
     *
     * @param {string} uri: URI to original resource
     *
     * @return {string} URI to archive the original resource
     */

    this.constructUri = function(uri) {
      if (!uri || uri === "" || typeof uri != "string") {
        return null;
      }
      // cors-anywhere is a proxy that adds a CORS header to the request
      return 'https://cors-anywhere.herokuapp.com/https://web.archive.org/save/' + uri;
    };

    /*
     * Creates a CORS request with cross-browser compatibility.
     *
     * @param {string} method: HTTP method for request.
     * @param {string} url: URL to a given resource.
     *
     * @return {XMLHttpRequest} appropriate HTTP request to url.
     */

    this.createCORSRequest = function(method, url, async) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr && url) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.

        xhr.open(method, url, async);
      } 
      else {

        // Otherwise, CORS is not supported by the browser.

        xhr = null;

      }
      return xhr;
    };

    /*
     * Extracts the URL from the server response if a well-formed one cannot be found from the 
     * location or content-location headers.
     *
     * @param {string} responseText: server response represented as text.
     *
     * @return {string}: well-formed part of URL to access the archived resource.
     */

    this.extractUrl = function(responseText) {
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
    };

    /*
     * Makes sure that portion of the URL following the first "/" is representative of an 
     * archived resource.
     *
     * @param {string} url: part of the URL to check.
     *
     * @return {boolean}: whether url matches the given pattern.
     */

    this.isWellFormedUrl = function(url) {

      // URLs to archived resources should always be of the form:
      // https://web.archive.org/web/(date-time of archival)/(URL of original resource).
      var pattern = /\/web\/[0-9]{4,14}\/http.+/
      return pattern.test(url);
    };

    /*
     * Records the day that an archival request was made in yyyy-mm-dd format.
     *
     * @return {string}: a string that represents the current date in yyyy-mm-dd format.
     */

    this.getDate = function() {
      var archTime = new Date();
      var month = ((archTime.getMonth() + 1) < 10) ? "0" + (archTime.getMonth() + 1) : archTime.getMonth() + 1;
      var day = (archTime.getDate() < 10) ? "0" + archTime.getDate() : archTime.getDate();
      var year = archTime.getFullYear();
      return year + "-" + month + "-" + day;
    };

    /*
     * Creates the decorated anchor tag that leads to the original resource.
     * 
     * @param {string} url: the URL to the original resource.
     * @param {string} archivedUrl: the URL to the archived version of the resource.
     * @param {string} date: the date represented in 14-digit form (yyyymmdd).
     *
     * @param {string}: <a> tag that meets RobustLink specifications.
     */

    this.makeAnchorTag = function(url, archivedUrl) {
      var date = this.getDate();
      return "Archived Link: "+"&lt;a href=\"" + archivedUrl + "\" data-originalurl=\"" + url + "\"" +
             " data-versiondate=\""+ date + "\"&gt;" + "Robust Link for: " + url + "&lt;/a&gt;";

    };
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

    this.attachAnchorNote = function (cLoc, loc, responseText) {
      var ZoteroPane = Zotero.getActiveZoteroPane(); 
      var selectedItems = ZoteroPane.getSelectedItems(); 
      var item = selectedItems[0]; 
      var url = item.getField('url');
      var note = new Zotero.Item('note'); 
      if (!this.isArchived(item)) {
        item.addTag("archived");
        item.saveTx();        
        if (loc) {
          note.setNote(this.makeAnchorTag(url, loc)); 
          note.parentID = item.id; 
          note.saveTx();
        }
        else if (cLoc) {
          if (this.isWellFormedUrl(cLoc)) {
            note.setNote(this.makeAnchorTag(url, "http://web.archive.org" + cLoc));
          }
          else {
            note.setNote(this.makeAnchorTag(url, "https://web.archive.org" + 
                         this.extractUrl(responseText)));
          }
          note.parentID = item.id; 
          note.saveTx();     
        }
        else {
          var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
          var notif = "Archive URL not found.";
          errorNotifWindow.changeHeadline(notif);
          errorNotifWindow.show();
          errorNotifWindow.startCloseTimer(8000);   
        }
      }
    };

    /*
     * Displays appropriate status window if there is an error with archiving a resource.
     *
     * @param {number} status: status code of a the server response.
     *
     * @return: nothing.
     */

    this.handleStatus = function(req, status) {
      var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
      var notif = "";
      var self = this;
      switch (status) {
        case 200:
          notif = "Success! Note contains archived link.";
          cLoc = req.getResponseHeader("content-location");
          loc = req.getResponseHeader("location");
          var responseText = req.responseText;
          self.attachAnchorNote(cLoc, loc, responseText);
          break;
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
      errorNotifWindow.startCloseTimer(3000);
    };

    /*
     * Ensures that a URL leads to a valid page and uses HTTP/HTTPS.
     *
     * @param {string} url: URL to be checked.
     *
     * returns {Boolean}: True if the URL leads to a resource that uses HTTP/HTTPS,
     *                    False otherwise.
     */

    this.checkValidUrl = function(url) {
      var pattern = /https?:\/\/.+/;
      var status = -1;
      var https = pattern.test(url);
      if (!https) {
        return false;
      }
      return true;
    };
    
    /*
     * Sets properties (ready state change callback, timeout callback, request headers) 
     * for the archive request.
     *
     * @param {Zotero.Item} item: selected item in the library to be archived.
     * @param {XMLHttpRequest} req: request to be modified.
     *
     * @return: nothing.
     */

    this.setRequestProperties = function(req) {
      var self = this;
      req.setRequestHeader('origin', 'https://web.archive.org/');
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      req.timeout = 10000;
      req.ontimeout = function() {
        var timeoutNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
        timeoutNotifWindow.changeHeadline("Request timed out. Try again later/check the URL");
        timeoutNotifWindow.show();
        timeoutNotifWindow.startCloseTimer(4000);
      }
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          self.handleStatus(req, req.status);
        }
      }
    };

    /*
     * Sends the request to archive a given resource. Sets the content of the extra field
     * to reflect the link to the archived version of the resource. 
     * 
     * @return: nothing
     */

    this.sendReq = function() {  
      var pane = Zotero.getActiveZoteroPane();
      var selectedItems = pane.getSelectedItems();
      var item = selectedItems[0];
      var url = item.getField('url');
      if (this.checkValidUrl(url) && !item.isAttachment()) {
        var fullURI = this.constructUri(url);
        var req = this.createCORSRequest("GET", fullURI, true);
        this.setRequestProperties(req);
        req.send();
      }
    };
}