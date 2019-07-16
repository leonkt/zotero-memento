{
	"translatorID": "ad6dd56e-7462-4d11-8457-b3c97d54d552",
	"translatorType": 2,
	"label": "MLA with Archive",
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

function parseAuthors(item) {
	var authors = "";
	var counter = 0;
	if (item.creators.length > 0) {
		for (var j in item.creators) {
			if (counter === item.creators.length - 1) {
				authors += item.creators[j].lastName + ", " + item.creators[j].firstName + ". ";
				break;
			}
			if (counter === 2) {
				authors += item.creators[j].lastName + ", " + item.creators[j].firstName + " et al. "
				break;
			}
			authors += item.creators[j].lastName + ", " + item.creators[j].firstName + ", ";
			counter++;
		}
	}

	return authors;
}


function convertItemToEntry(item) {
	var title = (item.title) ? "\"" + item.title + ".\" " : "";
	var author = parseAuthors(item);
	var siteTitle = (item.websiteTitle) ? item.websiteTitle + ". " : "";
	var url = (item.url) ? "<" + item.url + ">. " : "";
	var date = (item.date) ? item.date + ". " : "";
	var archived = (item.extra) ? "Archived at <" + item.extra + ">." : "";
	return author + title + siteTitle + date + url + archived;
}



function doExport() {
	while(item = Zotero.nextItem()) {
		Zotero.write(convertItemToEntry(item) + "\n\n");
	}
}