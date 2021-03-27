# zotero-memento

## Installation

Download the latest `ZoteroMemento.xpi` from the [releases page](https://github.com/leonkt/zotero-memento/releases/latest/). Note that if you're using Firefox, you have to right-click on the file and select <kbd>Save Link As…</kbd>, otherwise Firefox will try to install the file as its own extension (which will result in an error) since Firefox uses the same extension format.

Then, in Zotero, click <kbd>Tools</kbd> → <kbd>Add-ons</kbd> → <kbd>⚙</kbd> → <kbd>Install Add-On From File…</kbd> and select the `ZoteroMemento.xpi` file you've downloaded before. Finally, restart Zotero to enable the extension.

## Archiving a Webpage AUTOMATICALLY

Zotero Archive automatically saves pages added to your library through the Browser Connector to multiple internet archives (Internet Archive, archive.is, archive.today, etc.) It conveys the archival information to the user in the following ways:

   * Saves the URL of the archived version of the item in the Internet Archive to the "Extra" field.
   * Attaches a note with an anchor tag to the archived resource to the item.
   * Attaches the ORCID profiles of the authors to the item. These can be accessed by clicking the dropdown menu to view the notes and attachments.
   * This only works for resources saved from websites that support the Signposting standard. More info can be found at http://signposting.org/

## How to Archive Webpages MANUALLY

Once you save an item to the library via the Browser connector, a success popup indicates that all of the actions above were attempted. On an error, you could manually archive an item by right-clicking on a selected item, clicking on "Archive this Resource", and choosing an archive to push to.

## Translators

In chrome/content/scripts/, you will find a folder named translators, which contain a number of export translators. Each of these translators is based off of an existing translator in Zotero, with the addition of two more properties:

   * a URL to an archived version of the resource
   * the datetime that the resource was archived

To download each of these translators, search for the "Zotero" folder in your system (it should contain a "translators" subdirectory). Drag each of the translators from the extension into Zotero > translators. When prompted to replace the translators click "Replace", and you're done!

Currently, there are 5 translators that export your library to

   * BibLaTex
   * MLA
   * Robust Links (listed under HTML Snippet; more information can be found about Robust Links at                                 http://robustlinks.mementoweb.org/)
   * Bookmarks
   * Wikipedia Citation Template
