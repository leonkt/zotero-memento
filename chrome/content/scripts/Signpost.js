Zotero.Signpost = {
	modifyLink : function(item) {
		if (item.getField("DOI")) {
			item.setField("url", "https://doi.org/" + item.getField("DOI"));
		}
	},

	getAuthorOrcids : function(req, item) {
		orcids = [];
		var linkHdrText = req.getResponseHeader("Link");
	},
	
	signpostEntry : function() {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		this.modifyLink(item);
	}
}