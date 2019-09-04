Zotero.ArchivePusher = {
	/*
	 * Finds the submit ID in the server response; a new, host-specific submit ID is needed before
	 * submitting any web resource to "archive." sites. 
	 *
	 * @param {string} responseText: server response after GET request to the "archive."" site.
	 * 
	 * @return {string}: submit ID to be included in request data later. Empty string if the ID 
	 * 					 cannot be found.
	 */
	 
	extractSubmitId : function(responseText) {
		var nameLoc = responseText.indexOf("name=\"submitid\"");
		if (nameLoc > -1) {
			var startId = responseText.indexOf("value=\"", nameLoc) + 7;
			var endId = responseText.indexOf("\"", startId);
			return responseText.slice(startId, endId);
		}
		return "";
	},

	/*
	 * Obtains the submit ID and sends a request to archive the given resource in the "archive." sites.
	 *
	 * @return: nothing
	 */

	sendReq : function() {
		// Takes the selected item and attempts to archive it.
		var item = Zotero.getActiveZoteroPane().getSelectedItems()[0];
		// We attempt to archive it in all these sites; there are often a few that aren't successful.
		var archive_sites = ['archive.li', 'archive.vn','archive.fo', 'archive.md', 'archive.ph',
							 'archive.today','archive.is'];
		for (let site of archive_sites) {
			// This step is to retrieve the submitID.
			var submitIdReq = Zotero.IaPusher.createCORSRequest("GET", 
							  "https://cors-anywhere.herokuapp.com/https://" + site + "/", false);
			Zotero.IaPusher.setRequestProperties(submitIdReq);
			submitIdReq.send();
			var subId = this.extractSubmitId(submitIdReq.responseText);
			// Push to the archive; takes a few minutes for changes to be reflected on the site.
			var hostUrl = "https://" + site + "/submit/";
			var req = Zotero.IaPusher.createCORSRequest("POST", hostUrl, false);
			Zotero.IaPusher.setRequestProperties(req);
			// ESSENTIAL: we submit data with POST, 
			// (1) url field must be a URL to the page to be archived.
			// (2) submitid field must be the submitID retrieved from earlier on.
			// (3) anyway is optional.
			var params = {
				"url" : item.url,
				"submitid" : subId,
				"anyway" : 1
			};

			req.send(JSON.stringify(params));

			alert(req.responseText);
		}
	}
}