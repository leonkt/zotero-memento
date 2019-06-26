var pane = Zotero.getActiveZoteroPane();
var items = pane.getSelectedItems();

function addBeetleJuice() {
	var item = new Zotero.Item('Book');
	item.setField('title', 'Beetlejuice');
	item.save();
}