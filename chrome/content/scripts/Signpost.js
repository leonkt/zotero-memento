Zotero.Signpost = {
	modifyLink : function(item) {
		if (item.getField("DOI")) {
			item.setField("url", "https://doi.org/" + item.getField("DOI"));
		}
	},

	isSignposted : function(item) {
      	var tags = item.getTags();
      	for (i = 0; i < tags.length; i++) {
        	if (tags[i.toString()]["tag"] === "signposted") {
          		return true;
        	}
      	}
      	return false;
    },

	getAuthorOrcids : function(linkHdrText, responseText) {
		orcids = [];
		var start = 0;
		while (true && linkHdrText) {
			var currAuthor = linkHdrText.indexOf("rel=\"author\"", start);
			if (currAuthor === -1) {
				break;
			}
			var startOrcid = linkHdrText.lastIndexOf("http", currAuthor);
			var endOrcid = linkHdrText.lastIndexOf(">;", currAuthor);
			if (linkHdrText.slice(startOrcid, endOrcid).indexOf("orcid") != -1) {
				orcids.push(linkHdrText.slice(startOrcid, endOrcid));
			}
			start = currAuthor + 1;
		}
		return orcids;
	},
	
	attachAuthorOrcids : function(linkHdrText) {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		if (!linkHdrText || this.isSignposted(item)) {
			return;
		}
		var orcids = this.getAuthorOrcids(linkHdrText);
		for (var orcidUrl in orcids) {
			Zotero.Attachments.linkFromURL({
				url: orcids[orcidUrl.toString()],
				parentItemID: item.getField("id"),
				title: "Author ORCID"
			});
		}
		item.addTag("signposted");
		item.saveTx();
	},

	signpostEntry : function() {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		this.modifyLink(item);
	}
}