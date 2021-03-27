Zotero.IaPusher = {
    /*
     * Indicates whether an item has an "archived" tag or not.
     *
     * @param {Zotero.Item} item: item to be checked.
     *
     * @return {Boolean}: true if item has "archived" tag. Returns false otherwise.
     */

    isArchived : function(item) {
      for (tag in item.getTags()) {
        if (item.getTags()[tag]["tag"] == "archived") {
          return true;
        }
      }
      return false;
    },

    /*
     * Constructs the URI to archive a given resource.
     *
     * @param {string} uri: URI to original resource
     *
     * @return {string} URI to archive the original resource
     */

    constructUri : function(uri) {
      if (!uri || uri === "" || typeof uri != "string") {
        return null;
      }
      // cors-anywhere is a proxy that adds a CORS header to the request
      // https://cors-anywhere.herokuapp.com/
      return 'https://web.archive.org/save/' + uri;
    },

    /*
     * Creates a CORS request with cross-browser compatibility.
     *
     * @param {string} method: HTTP method for request.
     * @param {string} url: URL to a given resource.
     *
     * @return {XMLHttpRequest} appropriate HTTP request to url.
     */

    createCORSRequest : function(method, url, async) {
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
    },

    /*
     * Extracts the URL from the server response if a well-formed one cannot be found from the 
     * location or content-location headers.
     *
     * @param {string} responseText: server response represented as text.
     *
     * @return {string}: well-formed part of URL to access the archived resource.
     */

    extractUrl : function(responseText) {
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
    },

    /*
     * Makes sure that portion of the URL following the first "/" is representative of an 
     * archived resource.
     *
     * @param {string} url: part of the URL to check.
     *
     * @return {boolean}: whether url matches the given pattern.
     */

    isWellFormedUrl : function(url) {
      // URLs to archived resources should always be of the form:
      // https://web.archive.org/web/(date-time of archival)/(URL of original resource).
      var pattern = /\/web\/[0-9]{4,14}\/http.+/
      return pattern.test(url);
    },

    /*
     * Records the day that an archival request was made in yyyy-mm-dd format.
     * @param {string} : the version URL of the archived resource
     *
     * @return {string}: a string that represents the current date in yyyy-mm-dd format.
     */

    getDate : function(archivedUrl) {
      var start = archivedUrl.indexOf("web/") + 4;
      var end = archivedUrl.indexOf("/", start);
      var dateString = archivedUrl.slice(start, end);
      var year = (dateString.length >= 4) ? dateString.slice(0, 4) : "";
      var month = (dateString.length >= 6) ? "-" + dateString.slice(4, 6) : "";
      var day = (dateString.length >= 8) ? "-" + dateString.slice(6, 8) : "";
      var time = (dateString.length >= 14) ? "T" + dateString.slice(8, 10) + ":" 
              + dateString.slice(10, 12) + ":" + dateString.slice(12,14) + "Z" : ""; 
      return year + month + day + time;
    },

    setExtra : function(item, archivedUrl) {
      if (item.getField("extra").length != 0 ) {
        if (item.getField("extra").includes(archivedUrl)){
          return;
        }

        item.setField("extra", item.getField("extra") +"; " + archivedUrl);
      }
      else {
        item.setField("extra", archivedUrl);
      }
      item.saveTx();
    },
    /*
     * Creates the decorated anchor tag that leads to the original resource. Sets extra field to
     * reflect the archived link.
     * 
     * @param {Zotero.Item} item: the item whose extra field is to be set.
     * @param {string} url: the URL to the original resource.
     * @param {string} archivedUrl: the URL to the archived version of the resource.
     *
     * @param {String}: <a> tag that meets RobustLink specifications and the archived URL.
     */

    makeAnchorTag : function(item, url, archivedUrl) {
      var date = this.getDate(archivedUrl);
      return "Version URL: "+"&lt;a href=\"" + archivedUrl + "\" data-originalurl=\"" + 
              url + "\"" + " data-versiondate=\""+ date + "\"&gt;" + "Robust Link for: " + 
              url + "&lt;/a&gt;";

    },
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

    attachAnchorNote : function (item, archived) {
      var url = item.getField('url');
      var note = new Zotero.Item('note'); 
      var noteText = ""; 
      if (archived && archived != "") {
        noteText = this.makeAnchorTag(item, url, archived);
        if (this.isArchived(item)) {
          return;
        }
        note.setNote(noteText); 
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
    },

    /*
     * Displays appropriate status window if there is an error with archiving a resource.
     *
     * @param {number} status: status code of a the server response.
     *
     * @return: nothing.
     */

    handleStatus : function(item, req, status, archived) {
      var errorNotifWindow =  new Zotero.ProgressWindow({closeOnClick:true});
      var notif = "";
      switch (status) {
        case 200:
          notif = "Success! \"Extra\" has archived link.";
          this.attachAnchorNote(item, archived);
          break;
        case 401:
          break;
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
      errorNotifWindow.startCloseTimer(2000);
    },

    /*
     * Ensures that a URL leads to a valid page and uses HTTP/HTTPS.
     *
     * @param {string} url: URL to be checked.
     *
     * returns {Boolean}: True if the URL leads to a resource that uses HTTP/HTTPS,
     *                    False otherwise.
     */

    checkValidUrl : function(url) {
      var pattern = /https?:\/\/.+/;
      var status = -1;
      var https = pattern.test(url);
      if (!https) {
        return false;
      }
      return true;
    },
    
    /*
     * Searches and returns the response text for a given tag that contains the DOI url.
     *
     * @param {string} responseText: the response test from the Internet Archive.
     * @param {string} tagName: the tag that we locate to extract the DOI url.
     * 
     * @return {string}: return the text of tagName if the tagName is found in the response.
     *.                  Else, returns the empty string if the tagName can't be found.
     */

    recognizeDoiPattern : function(responseText, tagName) {
      var doiPattern = /\d+\.\d+/;
      var toMatchTag = new RegExp(tagName, "i");
      var startDoiCit = responseText.search(toMatchTag);
      if (startDoiCit != -1) {
        var citTrimmed = responseText.slice(startDoiCit);
        var startDoi = citTrimmed.search(/\d/);
        var endDoi = citTrimmed.indexOf("\"", startDoi);
        var doi = citTrimmed.slice(startDoi, endDoi);
        var validDoi = doiPattern.test(doi);
        if (validDoi) {
          if (doi.indexOf("doi") != - 1) {
            return doi;
          }
          return "https://doi.org/" + doi;
        }
      }
      return "";
    },

    /*
     * Creates the DOI URL for a journal article. This is to replace the landing page in the URL 
     * field. 
     *
     * @param {string} responseText: the response text from the Internet Archive.
     * 
     * @return {string}: If resource has a DOI return the DOI of the resource. Else, return empty 
     *                   string
     */

    makeDoiUrl : function(responseText) {
      var dcId = this.recognizeDoiPattern(responseText, "DC.identifier");
      var citDoi = this.recognizeDoiPattern(responseText, "citation_doi");

      if (dcId != "") {
        return dcId;
      }
      else if (citDoi != "") {
        return citDoi;
      }
      else {
        return "";
      }
    },

    /*
     * Sets properties (ready state change callback, timeout callback, request headers) 
     * for the archive request.
     *
     * @param {Zotero.Item} item: selected item in the library to be archived.
     * @param {XMLHttpRequest} req: request to be modified.
     *
     * @return: nothing.
     */

    setRequestProperties : function(req) {
      req.setRequestHeader('origin', 'https://web.archive.org/');
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    },

    /*
     * Sends the request to archive a given resource. Sets the content of the extra field
     * to reflect the link to the archived version of the resource. 
     * 
     * @return: nothing
     */

    getLastMemento : function(linkage) {
      return linkage.slice(linkage.lastIndexOf("<") + 1, linkage.lastIndexOf(">"));
    },

    onSend: function(item, req) {
      a_link = this.getLastMemento(req.getResponseHeader("Link"));
      this.setExtra(item, a_link);
      this.handleStatus(item, req, req.status, a_link);
      item.addTag("archived");
      item.saveTx();
    },

    sendReq : async function() {  
      var pane = Zotero.getActiveZoteroPane();
      var selectedItems = pane.getSelectedItems();
      var item = selectedItems[0];
      var url = item.getField('url');
      if (this.checkValidUrl(url)) {
        var fullURI = this.constructUri(url);
        var req = this.createCORSRequest("GET", fullURI, true);
        this.setRequestProperties(req);
        if (!Zotero.Signpost.isSignposted(item) && !this.isArchived(item)) {
          var prog = new Zotero.ProgressWindow({closeOnClick:true});
          prog.changeHeadline("This may take a while...");
          prog.show()
          prog.startCloseTimer(10000);

          req.addEventListener('load', function(){
            Zotero.IaPusher.onSend(item, req)
          });
          req.send();
          //return a_link;
        }
        //return "";
      }
    }
}
