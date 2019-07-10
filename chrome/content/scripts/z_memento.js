Zotero.z_memento = {
  archived : 1,
  init: function () {
    // if an event involving an item occurs, notifierCallback is invoked.
    var notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, ['item']);
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
  },
 
 
  // Callback implementing the notify() method to pass to the Notifier
  notifierCallback: {
    notify: function(event, type, id, extraData) {
      const WEBPAGE_ITEM_ID = 13;
      var item = Zotero.Items.get(id);
      if (event == 'add') {
        IAPusher.sendReq();
      }
    }
  }
};

window.addEventListener('load', function(e) { Zotero.z_memento.init(); }, false);