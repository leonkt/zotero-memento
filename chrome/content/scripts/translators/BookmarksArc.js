{
	"translatorID": "4e7456e0-02be-4848-86ef-79a64185aad8",
	"label": "Bookmarks",
	"creator": "Leon Tran",
	"target": "html",
	"minVersion": "1.0.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 3,
	"browserSupport": "gcsibv",
	"lastUpdated": "2019-08-27"
}


var MAX_DETECT_LINES = 150;
var bookmarkRE = /<DT>[\s\r\n]*<A[^>]+HREF[\s\r\n]*=[\s\r\n]*(['"])([^"]+)\1[^>]*>([^<\n]+?)<\/A>/gi;
var collectionRE = /<DT>[\s\r\n]*<H3[^>]*>([^<]+?)<\/H3>/gi;
var collectionEndRE = /<\/DL>/gi;
var descriptionRE = /<DD>([\s\S]*?)(?=<(?:DT|\/DL|HR)>)/gi;
var bookmarkDetailsRE = /[\s\r\n](HREF|TAGS|ADD_DATE|SHORTCUTURL|DESCRIPTION)[s\r\n]*=[s\r\n]*(['"])([\s\S]*?)\2/gi;

function detectImport() {
	var text = "";
	var line, m;
	var lastIndex = 0;
	var i = 0;
	while ((line = Zotero.read()) !== false && (i++ < MAX_DETECT_LINES)) {
		text += line;

		bookmarkRE.lastIndex = lastIndex; //don't restart searches from begining
		m = bookmarkRE.exec(text);
		if (m && lastIndex < bookmarkRE.lastIndex) lastIndex = bookmarkRE.lastIndex;

		if (m && m[2].toUpperCase().indexOf('PLACE:') !== 0) {
			Zotero.debug("Found a match with line: "+m[0]);
			return true;
		}
	}
	return false;	
}

function doImport() {
	var itemID = 0;
	var l, m, re, line = '';
	var allREs = {
		b: bookmarkRE,
		c: collectionRE,
		ce: collectionEndRE,
		d: descriptionRE
	};
	var firstMatch, firstMatchAt, openItem, lastIndex = 0;
	var collectionStack = [], collection;
	
	while ((l = Zotero.read()) !== false) {
		line += '\n' + l;
		bookmarkRE.lastIndex = collectionRE.lastIndex = descriptionRE.lastIndex = 0;
		do {
			firstMatch = false;
			firstMatchType = false;
			
			for (var re in allREs) {
				if (re == 'd' && !openItem) {
					continue;
				}
				
				allREs[re].lastIndex = lastIndex;
				m = allREs[re].exec(line);
				if (m && (!firstMatchType || m.index < firstMatch.index)) {
					firstMatch = m;
					firstMatchType = re;
				}
			}
			
			if (firstMatchType) {
				m = firstMatch;
				lastIndex = allREs[firstMatchType].lastIndex;
			}
			
			switch (firstMatchType) {
				case 'b': //create new webpage item
					if (openItem) openItem.complete();
					
					var title = m[3].trim();
					
					if (!title || m[2].toUpperCase().indexOf('PLACE:') == 0) {
						Z.debug('Skipping item with no title or special "place:" item');
						openItem = false;
						break;
					}
					
					openItem = new Zotero.Item("webpage");
					openItem.title = ZU.unescapeHTML(title);
					openItem.itemID = openItem.id = itemID++;
					if (collection) collection.children.push(openItem);
					
					bookmarkDetailsRE.lastIndex = 0;
					var detailMatch;
					while (detailMatch = bookmarkDetailsRE.exec(m[0])) {
						switch (detailMatch[1].toUpperCase()) {
							case 'HREF':
								openItem.url = detailMatch[3];
							break;
							case 'DESCRIPTION':
								openItem.abstractNote = detailMatch[3];
							break;
							case 'TAGS':
							case 'SHORTCUTURL':
								openItem.tags = openItem.tags.concat(detailMatch[3].split(/[\s\r\n]*,[\s\r\n]*/));
							break;
							case 'ADD_DATE':
								openItem.accessDate = convertDate(detailMatch[3])
							break;
						}
					}
				break;
				case 'c': //start a collection
					if (openItem) {
						openItem.complete();
						openItem = false;
					}
					
					if (collection) collectionStack.push(collection)
					
					collection = new Zotero.Collection();
					collection.type = 'collection';
					collection.name = ZU.unescapeHTML(m[1]);
					Zotero.debug("Starting collection: "+ collection.name);
					collection.children = new Array();
				break;
				case 'ce': //end a collection
					if (openItem) {
						openItem.complete();
						openItem = false;
					}
					
					var parentCollection = collectionStack.pop();
					
					if (parentCollection) {
						if (collection.children.length) {
							parentCollection.children.push(collection);
						}
						collection = parentCollection;
					} else if (collection && collection.children.length) {
						collection.complete();
						collection = false;
					}
				break;
				case 'd': //add description to bookmark and complete item
					openItem.abstractNote = ZU.trimInternal(m[1]);
					openItem.complete();
					openItem = false;
				break;
			}
		} while (firstMatch);
		
		line = line.substr(lastIndex);
		lastIndex = 0;
	}
	
	if (openItem) openItem.complete();
	if (collection) {
		var parentCollection;
		while (parentCollection = collectionStack.pop()) {
			if (collection.children.length) {
				parentCollection.children.push(collection);
			}
			collection = parentCollection;
		}
		if (collection.children.length) {
			collection.complete();
		}
	}
}

function convertDate(timestamp){
	var d = new Date(timestamp*1000);
 	function pad(n) { return ZU.lpad(n, '0', 2) };
 	return ZU.lpad(d.getUTCFullYear(), '0', 4)+'-'
	  + pad(d.getUTCMonth()+1)+'-'
	  + pad(d.getUTCDate())+' '
	  + pad(d.getUTCHours())+':'
	  + pad(d.getUTCMinutes())+':'
	  + pad(d.getUTCSeconds());
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

function doExport() {
	var item;
	
	var header = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n'+
'<!-- This is an automatically generated file.\n'+
'     It will be read and overwritten.\n'+
'     DO NOT EDIT! -->\n'+
'<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n'+
'<TITLE>Bookmarks</TITLE>\n'+
'<H1>Bookmarks Menu</H1>\n'+
'<DL>\n';
	var footer = '</DL>';
	//var tags = "";

	Zotero.write(header);
	while (item = Zotero.nextItem()) {
		// TODO Be more verbose, making an informative title and including more metadata
		//tags = item.tags.forEach(function (tag) {return tag.tag}).join(",");
		if (item.url) {
			if (item.extra) {
				Zotero.write('<DT><A HREF=\"'+item.url+'\" data-versionurl=\"'+ item.extra +'\"'+ 'data-versiondate=\"' + parseDate(item.extra) +'\">'+item.title +'</A>\n');
			}
			else {
				Zotero.write('<DT><A HREF=\"'+ item.url + '\">' + item.title +'</A>\n');
			}
		} 
		else {
			Zotero.debug("Skipping item without URL: "+item.title);
		}
	}
	Zotero.write(footer);
}


