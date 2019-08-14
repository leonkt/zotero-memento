Zotero.Memento = {
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
      var item = Zotero.Items.get(id);
      if (event == 'add') {
        var req = Zotero.IaPusher.sendReq();
        Zotero.Signpost.signpostEntry(req.getResponseHeader("X-Archive-Orig-Link"));
      }
    }
  }
};

window.addEventListener('load', Zotero.Memento.init(), false);