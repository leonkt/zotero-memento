{
	"translatorID": "f0c6f80b-1689-45e3-a598-138e3f65d53e",
	"translatorType": 2,
	"label": "HTML Snippet",
	"creator": "Leon Tran",
	"target": "txt",
	"minVersion": "1.0.*",
	"maxVersion": "5.0.*",
	"browserSupport": "gcs",
	"priority": 25,
	"displayOptions": {
		"exportNotes": true,
		"exportFileData": false
	},
	"inRepository": true,
	"lastUpdated": "2019-07-15 05:55:13"
}

function parseDate(archivedUrl) {
	var start = archivedUrl.indexOf("web/") + 4;
	var end = archivedUrl.indexOf("/", start);
	var dateString = archivedUrl.slice(start, end);
	var year = (dateString.length >= 4) ? dateString.slice(0, 4) : "";
	var month = (dateString.length >= 6) ? "-" + dateString.slice(4, 6) : "";
	var day = (dateString.length >= 8) ? "-" + dateString.slice(6, 8) : "";
	var time = (dateString.length >= 14) ? "T" + dateString.slice(8, 10) + ":" 
			   + dateString.slice(10, 12) + ":" + dateString.slice(12,14) + "Z" : ""; 
	return year + month + day + time;
}

function makeAnchorTag(item, url, archivedUrl) {
	if (archivedUrl) {
    	return "<a href=\"" + archivedUrl + "\" data-originalurl=\"" + 
        		url + "\"" + " data-versiondate=\""+ parseDate(archivedUrl) + "\">" + "Robust Link for: " + 
            	url + "</a>";
    }
    else {
    	return "<a href=\"" + url + "\">" + "Robust Link for: " + url + "</a>";
    }

}

function doExport() {
	while (item = Zotero.nextItem()) {
		Zotero.write(makeAnchorTag(item, item.url, item.extra) + "\n\n");
	}
}