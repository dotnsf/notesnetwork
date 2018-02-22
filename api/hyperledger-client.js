//. hyperledger-client.js

//. Run following commands to create BNC(Business Network Card) for PeerAdmin
//. $ cd /fabric
//. $ ./createPeerAdminCard.sh

var settings = require( './settings' );

const NS = 'me.juge.notesnetwork';
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

const HyperledgerClient = function() {
  var vm = this;
  vm.businessNetworkConnection = null;
  vm.businessNetworkDefinition = null;

  vm.prepare = (resolved, rejected) => {
    if (vm.businessNetworkConnection != null && vm.businessNetworkDefinition != null) {
      resolved();
    } else {
      console.log('HyperLedgerClient.prepare(): create new business network connection');
      vm.businessNetworkConnection = new BusinessNetworkConnection();
      const cardName = settings.cardName;
      return vm.businessNetworkConnection.connect(cardName)
      .then(result => {
        vm.businessNetworkDefinition = result;

        //. Events Subscription
        vm.businessNetworkConnection.on( 'event', ( evt ) => {
          var event = {
            type: evt['$type'],
            eventId: evt.eventId,
            timestamp: evt.timestamp,
            id: evt.id,
            user_id: evt.user_id,
            db_id: evt.db_id,
            doc_unid: evt.doc_unid,
            body: evt.body,
            datetime: evt.datetime
          };
          //. event: { '$class': '***', 'eventId': 'xxxx-xxxx-xxxx-xxxxxx#x' }
          console.log( event );
        });

        resolved();
      }).catch(error => {
        console.log('HyperLedgerClient.prepare(): reject');
        rejected(error);
      });
    }
  };

  //. UpdateNote
  vm.updateNoteTx = (note, resolved, rejected) => {
    vm.prepare(() => {
      let factory = vm.businessNetworkDefinition.getFactory();
      let transaction = factory.newTransaction(NS, 'UpdateNoteTx');
      //console.log( transaction );
      transaction.id = note.id;
      transaction.user_id = note.user_id;
      transaction.db_id = note.db_id;
      transaction.doc_unid = note.doc_unid;
      if( note.body ){ transaction.body = note.body; }

      //console.log( transaction );

      return vm.businessNetworkConnection.submitTransaction(transaction)
      .then(result => {
        var result0 = {transactionId: transaction.transactionId, timestamp: transaction.timestamp};
        resolved(result0);
      }).catch(error => {
        console.log('HyperLedgerClient.updateNoteTx(): reject');
        rejected(error);
      });
    }, rejected);
  };

  vm.getUpdateNote = (id, resolved, rejected) => {
    vm.prepare(() => {
      return vm.businessNetworkConnection.getAssetRegistry(NS + '.UpdateNote')
      .then(registry => {
        return registry.resolve(id);
      }).then(updatenote => {
        resolved(updatenote);
      }).catch(error => {
        console.log('HyperLedgerClient.getUpdateNote(): reject');
        rejected(null);
      });
    }, rejected);
  };

  vm.getAllUpdateNotes = (resolved, rejected) => {
    vm.prepare(() => {
      return vm.businessNetworkConnection.getAssetRegistry(NS + '.UpdateNote')
      .then(registry => {
        return registry.getAll();
      })
      .then(items => {
        resolved(items);
      }).catch(error => {
        console.log('HyperLedgerClient.getAllUpdateNotes(): reject');
        rejected(error);
      });
    }, rejected);
  };

  //. Not sophisticated enough yet ..
  vm.queryUpdateNotes = ( keyword, resolved, rejected ) => {
    vm.getAllUpdateNotes((updatenotes0) => {
      var updatenotes = [];
      updatenotes0.forEach( function( updatenote0 ){
        if( updatenote0.user_id.indexOf( keyword ) > -1 || updatenote0.doc_unid.indexOf( keyword ) > -1 || updatenote0.body.indexOf( keyword ) > -1 ){
          updatenotes.push( updatenote0 );
        }
      });
      resolved(updatenotes);
    }, rejected);
  };

  vm.queryUpdateNotesByUNID = ( doc_unid, resolved, rejected ) => {
    var where = 'doc_unid == _$doc_unid';
    var params = { doc_unid: doc_unid };
    vm.prepare(() => {
      var select = 'SELECT ' + NS + '.UpdateNote WHERE (' + where + ')';
      var query = vm.businessNetworkConnection.buildQuery( select );

      return vm.businessNetworkConnection.query(query, params)
      .then(updatenotes => {
        let serializer = vm.businessNetworkDefinition.getSerializer();
        var result = [];
        updatenotes.forEach(updatenote => {
          //result.push(serializer.toJSON(item));
          //result.push( { id: item.id, name: item.name, type: item.type, body: item.body, amount: item.amout } );
          result.push(updatenote);
        });
        resolved(result);
      }).catch(error => {
        console.log('HyperLedgerClient.queryUpdateNotesByUNID(): reject');
        console.log( error );
        rejected(error);
      });
    }, rejected);
  };


  //. Transaction Registries
  vm.getTransactionRegistries = ( resolved, rejected ) => {
    vm.prepare(() => {
      return vm.businessNetworkConnection.getAllTransactionRegistries()
      .then(registries => {
        resolved(registries);
      }).catch(error => {
        console.log('HyperLedgerClient.getTransactionRegistries(): reject');
        console.log( error );
        rejected(error);
      });
    }, rejected);
  };

  //. All Transactions
  vm.getAllTransactions = ( transactionRegistry, resolved, rejected ) => {
    vm.prepare(() => {
      return transactionRegistry.getAll()
      .then(transactions0 => {
        var transactions = [];
        transactions0.forEach( function( transaction0 ){
          transactions.push( { transactionId: transaction0.transactionId, timestamp: transaction0.timestamp /*, item: transaction0.item */, namespace: transaction0['$namespace'], type: transaction0['$type'] } );
        });
        resolved( transactions );
      }).catch(error => {
        console.log('HyperLedgerClient.getAllTransactions(): reject');
        console.log( error );
        rejected(error);
      });
    }, rejected);
  };

  //. Transaction detail
  vm.getTransaction = ( type, transactionId, resolved, rejected ) => {
    vm.prepare(() => {
      return vm.businessNetworkConnection.getTransactionRegistry(NS + '.' + type)
      .then(registry => {
        return registry.get(transactionId);
      }).then(transaction => {
        var serializer = vm.businessNetworkDefinition.getSerializer();
        resolved( serializer.toJSON( transaction ) );
      }).catch(error => {
        console.log('HyperLedgerClient.getTransaction(): reject');
        console.log( error );
        rejected(error);
      });
    }, rejected);
  };
}

module.exports = HyperledgerClient;
