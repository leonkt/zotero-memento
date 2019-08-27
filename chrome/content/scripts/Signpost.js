Zotero.Signpost = {
	/*
	 * Sets the given item's URL field if the item is a Journal Article.
	 * 
	 * @param {Zotero.Item} item: the item that we need to modify.
	 *
	 * @returns: nothing.
	 */

	modifyLink : function(item) {
		if (item.getField("DOI")) {
			item.setField("url", item.getField("DOI"));
		}
	},

	/*
	 * Determines whether the given item has had its author's ORCIDs attached and its URL changed.
	 * 
	 * @param {Zotero.Item} item: currently selected item Zotero.
	 * 
	 * @return {Boolean}: True if the item has an author's ORCID attached to it. Else return False.
	 */

	isSignposted : function(item) {
      	for (i = 0; i < item.getAttachments().length; i++) {
        	var currAttach = Zotero.Items.get(item.getAttachments()[i.toString()]);
        	if (currAttach.getField("title").indexOf("ORCID") != -1) {
        		return true;
        	}
      	}
      	return false;
    },

    /*
	 * Searches the Link header text for URLs to the authors' ORCID profiles. 
	 *
	 * @param {string} linkHdrText: the text associated with the Link header.
	 * 
	 * @return {Array}: list of URLs to the ORCID profiles of the authors.
	 */

	getAuthorOrcids : function(linkHdrText) {
		orcids = [];
		var start = 0;
		while (linkHdrText) {
			var currAuthor = linkHdrText.indexOf("rel=\"author\"", start);
			if (currAuthor === -1) {
				break;
			}
			var startOrcid = linkHdrText.lastIndexOf("http", currAuthor);
			var endOrcid = (linkHdrText.lastIndexOf(">;", currAuthor) != -1) 
							? linkHdrText.lastIndexOf(">;", currAuthor) 
							:linkHdrText.lastIndexOf(";", currAuthor) ;
			if (linkHdrText.slice(startOrcid, endOrcid).indexOf("orcid") != -1) {
				orcids.push(linkHdrText.slice(startOrcid, endOrcid));
			}
			start = currAuthor + 1;
		}
		return orcids;
	},

	/*
	 * Sets request headers to allow communication with the ORCID API.
	 *
	 * @param {XMLHttpRequest} req: the request to be modified.
	 *
	 * @return: nothing.
	 */

	setRequestProperties : function(req) {
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      req.setRequestHeader('Accept', 'application/vnd.orcid+xml');
      req.setRequestHeader('Authorization', 'Bearer f5af9f51-07e6-4332-8f1a-c0c11c1e3728');
    },

    /*
	 * Uses ORCID API to get the name associated with each ORCID profile.
	 *
	 * @param {string} fullOrcidUrl: the URL to an author's ORCID profile.
	 * 
	 * @returns {string}: the name of the author associated with fullOrcidUrl. Returns null if the
	 *                    author's name cannot be found.
	 */

	getAuthorName : function(fullOrcidUrl) {
		var orcidPattern = /[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}/
		var orcidIdStart = fullOrcidUrl.search(orcidPattern);
		var orcidId = fullOrcidUrl.slice(orcidIdStart, orcidIdStart + 19);
		var orcidReqUrl = "https://cors-anywhere.herokuapp.com/https://sandbox.orcid.org/v2.0/" 
						  + orcidId +"/record";
		var req = Zotero.IaPusher.createCORSRequest("GET", orcidReqUrl, false);
		this.setRequestProperties(req);
		req.send();


		console.log(req.responseText);


		var authorNameStart = req.responseText.indexOf(">", 
							  req.responseText.indexOf("<personal-details:credit-name>")) + 1;
		var authorNameEnd = req.responseText.indexOf("</personal-details:", authorNameStart);

	
		return (authorNameStart < 1 || authorNameEnd < 1) ? null 
			   : req.responseText.slice(authorNameStart, authorNameEnd);
	},

	/*
	 * Creates and attaches the link to the author's ORCID profile for the currently selected item.
	 *
	 * @param {string} linkHdrText: the text associated with the Link response header.
	 *
	 * @return: nothing.
	 */

	attachAuthorOrcids : function(linkHdrText) {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		if (!linkHdrText || this.isSignposted(item)) {
			return;
		}
		var orcids = this.getAuthorOrcids(linkHdrText);
		for (var orcidUrl in orcids) {
			var authorName = this.getAuthorName(orcids[orcidUrl.toString()]);
			Zotero.Attachments.linkFromURL({
				url: orcids[orcidUrl.toString()],
				parentItemID: item.getField("id"),
				title: (authorName) ? authorName + "'s ORCID Profile" :"Author's ORCID Profile"
			});
		}
	},

	/*
	 * Attaches links to the authors' ORCID profiles to the selected item and modifies the URL 
	 * field of the item to the DOI URL. 
	 * 
	 * @param {string} linkText: the text associated with the Link response header.
	 *
	 * @return: nothing.
	 */

	signpostEntry : function(linkText) {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		this.modifyLink(item);
		this.attachAuthorOrcids(linkText);
	}
}