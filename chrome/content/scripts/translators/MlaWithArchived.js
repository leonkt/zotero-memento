{
	"translatorID": "ad6dd56e-7462-4d11-8457-b3c97d54d552",
	"translatorType": 2,
	"label": "MLA",
	"creator": "Leon Tran",
	"target": "html",
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

/*function makeRobustVersionAnchorTag(archivedUrl, url) {
	return "<a href=\"" + archivedUrl + "\" data-originalurl=\"" + 
              url + "\"" + " data-versiondate=\""+ parseDate(archivedUrl) + "\"&gt;" +
              archivedUrl + "</a>";

}

function makeRobustOriginalAnchorTag(archivedUrl, url) {
	return "<a href=\"" + url + "\" data-versionurl=\"" + 
              archivedUrl + "\"" + " data-versiondate=\""+ parseDate(archivedUrl) + "\">" + 
              url + "</a>;";
}*/

function makeAnchorTag(url) {
	var http = url.indexOf("http://");
	var https = url.indexOf("https://");
	var slicedUrl = url;
	if (http != -1) {
		slicedUrl = url.slice(http + 7);
	}
	else if (https != -1) {
		slicedUrl = url.slice(https + 8);
	}
	return "<a href=\"" + url + "\">" + slicedUrl + "</a>";
}

function createMlaDateString(date) {
	var dateString = "";
	var monthNames = [
		"Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", 
		"Aug.", "Sep.","Oct.", "Nov.", "Dec."
	];
	var dateObj = new Date(date);
	var invalidDateString = (isNaN(dateObj.getDate())) || (isNaN(dateObj.getMonth())) || 
						  (isNaN(dateObj.getFullYear()));
	return (invalidDateString) ? "" : dateObj.getDate() + " " + monthNames[dateObj.getMonth()] + " " + 
							          dateObj.getFullYear();
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
	var title = (item.title && item.title.trim() != "") ? "\"" + item.title + ".\" " : "";
	var author = parseAuthors(item);
	var siteTitle = (item.websiteTitle && item.websiteTitle.trim() != "") ? "<i>" + item.websiteTitle 
																		    + "</i>" : "";
	var date = (item.date && item.date.trim() != "") ? createMlaDateString(item.date) : "";
	var url = (item.url && item.url.trim() != "") ? makeAnchorTag(item.url) : "";
	var dateTitleUrl = "";
	if (siteTitle != "") {
		if (date === "" && url != "") {
			dateTitleUrl = "<i>" + siteTitle + "</i>, " + url + ".";
		}
		else if (date != "" && url === "") {
			dateTitleUrl = "<i>" + siteTitle + "</i>, " + date + ".";
		}
		else {
			dateTitleUrl = "<i>" + siteTitle + "</i>, " + date + ", " + url + ".";
		}
	}
	else if (siteTitle === "") {
		if (date === "" && url != "") {
			dateTitleUrl = url + ".";
		}
		else if (date != "" && url === "") {
			dateTitleUrl = date + ".";
		}
		else if (date != "" && url != "") {
			dateTitleUrl = date + ", " + url + ".";
		}
	}
	var accessed = (item.accessDate && item.accessDate.trim() != "") ? 
					" Accessed " + createMlaDateString(item.accessDate) + "." : "";
	var archived = (item.extra && item.extra.trim() != "") ? " VersionURL " + makeAnchorTag(item.extra) 
														   + ". VersionDate " + parseDate(item.extra) + "." : "";
	return author + title + dateTitleUrl + accessed + archived;
}



function doExport() {
	while(item = Zotero.nextItem()) {
		Zotero.write(convertItemToEntry(item) + "<br/><br/>");
	}
}