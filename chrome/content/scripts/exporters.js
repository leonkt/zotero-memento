
class Exporter {
	constructor() {
		if (new.target == Exporter){
			throw new TypeError("Cannot construct Exporter instances directly");
		}
		this.style = null;
	}

	findArchivedUrlFromNote(item) {
		if (IAPusher.isArchived(item)) {
			var noteIds = item.getNotes();
			for (let id of noteIds) {
				var currNote = Zotero.Items.get(id);
				var noteText = currNote.getNote();
				if (noteText.includes("Archived Link:")) {
					var start = noteText.indexOf("href=\"") + 6;
					var end = noteText.indexOf("\"", start);
					return noteText.slice(start, end);
				}
			}
		}
		return null;
	}

	convertItemToEntry(item) {
		const CITATION_STYLE_FIELD = "export.quickCopy.setting";
		var savedPref = Zotero.Prefs.get(CITATION_STYLE_FIELD);
		Zotero.Prefs.set(CITATION_STYLE_FIELD, this.style);
		var qc = Zotero.QuickCopy;
		var baseCitation = qc.getContentFromItems([item], Zotero.Prefs.get(CITATION_STYLE_FIELD));
		Zotero.Prefs.set(CITATION_STYLE_FIELD, savedPref);
		return baseCitation["text"];
	}

	convertCollectionToCitations() {
		var citationList = [];
		var pane = Zotero.getActiveZoteroPane();
		var items = pane.getSelectedCollection().getChildItems();
		for (i = 0; i < items.length; i++) {
			citationList.push(this.convertItemToEntry(items[i.toString()]));
		}
		return citationList;
	}

	saveFile() {
		return undefined;
	}
}

class MlaExporter extends Exporter {
	constructor() {
		super();
		this.style = "bibliography=http://www.zotero.org/styles/modern-language-association";
	}

	convertItemToEntry(item) {
		var archivedUrl = this.findArchivedUrlFromNote(item);
		var mlaCitation = super.convertItemToEntry(item);
		if (IAPusher.isArchived(item)) {
			mlaCitation += "Internet Archive." + archivedUrl;
		}
		return mlaCitation;
	}

	saveFile() {
		var citationList = this.convertCollectionToCitations();
		return citationList;
	}


}

/*class SnippetExporter extends Exporter() {

}

class BibtexExporter extends Exporter() {

}*/