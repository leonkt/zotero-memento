/*
 * Pushes a given webpage to the Internet Archive.
 * 
 * @param uri: URI of the page to archive
 * @return: URI of the archived version of the webpage.
 */
/*function push(item) {
	var req = require('request');
	
	var init = {
		method: 'GET',
		uri: pusher.constructURI(item.getField('url'))
	};
	alert(item.getField('url'));
	req(init, function(error, response, body) {
		item.setField('extra', pusher.parseResponse(error, response, body));
	});
}*/

function modifyExtra() {
	var req = require('request');
	var pusher = require('IA_pusher');
	var pane = Zotero.getActiveZoteroPane();
	var selectedItems = pane.getSelectedItems();
	var item = selectedItems[0];
	var partialURI = item.getField('url');
	var init = {
		method: 'GET',
		uri: pusher.constructURI(partialURI)
	};
	alert(tem.getField('url'));
	req(init, function(error, response, body) {
		item.setField('extra', pusher.parseResponse(error, response, body));
		item.save();
	});
}

function test() {
	var pane = Zotero.getActiveZoteroPane();
	var item = new Zotero.Item('book');
	item.setField('title', "beetlejuice");
	item.save();
}
