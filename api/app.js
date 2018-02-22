//. app.js


var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    cloudantLib = require( 'cloudant' ),
    crypto = require( 'crypto' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    http = require( 'http' ),
    uuid = require( 'node-uuid' ),
    jwt = require( 'jsonwebtoken' ),
    app = express();
var settings = require( './settings' );
var appEnv = cfenv.getAppEnv();

const useCloudant = ( settings.cloudant_db ? true : false );
var cloudant = null;
var db = null;
if( useCloudant ){
  cloudant = cloudantLib( { account: settings.cloudant_username, password: settings.cloudant_password } );
  cloudant.db.get( settings.cloudant_db, function( err, body ){
    if( err ){
      if( err.statusCode == 404 ){
        cloudant.db.create( settings.cloudant_db, function( err, body ){
          if( err ){
            db = null;
          }else{
            db = cloudant.db.use( settings.cloudant_db );
          }
        });
      }else{
        db = null;
      }
    }else{
      db = cloudant.db.use( settings.cloudant_db );
    }
  });
}

const HyperledgerClient = require( './hyperledger-client' );
const client = new HyperledgerClient();

var port = 3001; /*appEnv.port || 3000*/;

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

app.all( '/doc/*', basicAuth( function( user, pass ){
  return ( user === settings.basic_username && pass === settings.basic_password );
}));

app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  res.write( 'OK' );
  res.end();
});

var apiRoutes = express.Router();


/* Secret API */
apiRoutes.get( '/transactions', function( req, res ){
  res.contentType( 'application/json' );
  client.getTransactionRegistries( registries => {
    var messages = [];
    var idx = 0;
    for( var i = 0; i < registries.length; i ++ ){
      var registry = registries[i];
      client.getAllTransactions( registry, transactions => {
        transactions.forEach( transaction => {
          messages.push( transaction );
        });

        idx ++;
        if( idx >= registries.length ){
          //. sort by timestamp
          messages.sort( compareByTimestamp );
          res.write( JSON.stringify( { status: true, transactions: messages }, 2, null ) );
          res.end();
        }
      }, error => {
        idx ++;
        if( idx >= registries.length ){
          //. sort by timestamp
          messages.sort( compareByTimestamp );
          res.write( JSON.stringify( { status: true, transactions: messages }, 2, null ) );
          res.end();
        }
      });
    }
  }, error => {
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
    res.end();
  });
});

apiRoutes.get( '/transaction', function( req, res ){
  res.contentType( 'application/json' );
  var type = req.query.type;
  var transactionId = req.query.transactionId;
  client.getTransaction( type, transactionId, transaction => {
    res.write( JSON.stringify( { status: true, transaction: transaction }, 2, null ) );
    res.end();
  }, error => {
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
    res.end();
  });
});

apiRoutes.post( '/updatenote', function( req, res ){
  res.contentType( 'application/json' );

  var id = ( req.body.id ? req.body.id : uuid.v1() );
  var user_id = ( req.body.user_id ? req.body.user_id : '' );
  var db_id = ( req.body.db_id ? req.body.db_id : '' );
  var doc_unid = ( req.body.doc_unid ? req.body.doc_unid : '' );
  var body = ( req.body.body ? req.body.body : null );
  var hash_body = body;

  //. SHA512 で body をハッシュ化
  if( hash_body ){
    var hash = crypto.createHash( 'sha512' );
    hash.update( hash_body );
    hash_body = hash.digest( 'hex' );
  }

  //. 新規作成
  if( id && user_id && db_id && doc_unid ){
    var updatenote1 = {
      id: id,
      user_id: user_id,
      db_id: db_id,
      doc_unid: doc_unid,
      body: hash_body
    };
    client.updateNoteTx( updatenote1, result => {
      console.log( 'result(0)=' + JSON.stringify( result, 2, null ) );

      if( db ){
        let transaction = {};
        transaction.id = id;
        transaction.user_id = user_id
        transaction.db_id = db_id;
        transaction.doc_unid = doc_unid;
        transaction.body = body;
        db.insert( transaction, id, function( err, body, header ){
          if( err ){
          }else{
          }
        });
      }

      res.write( JSON.stringify( { status: true, result: result }, 2, null ) );
      res.end();
    }, error => {
      res.status( 500 );
      res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
      res.end();
    });
  }else{
    //. 必須項目が足りない
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'Failed to create updateNote.' }, 2, null ) );
    res.end();
  }
});

apiRoutes.get( '/updatenotes', function( req, res ){
  res.contentType( 'application/json' );

  client.getAllUpdateNotes( result => {
    var updatenotes = [];
    result.forEach( updatenote0 => {
      updatenotes.push( { id: updatenote0.id, user_id: updatenote0.user_id, db_id: updatenote0.db_id, doc_unid: updatenote0.doc_unid, body: updatenote0.body } );
    });
    res.write( JSON.stringify( updatenotes, 2, null ) );
    res.end();
  }, error => {
    res.status( 500 );
    res.write( JSON.stringify( error, 2, null ) );
    res.end();
  });
});

apiRoutes.get( '/updatenote', function( req, res ){
  res.contentType( 'application/json' );

  var id = req.query.id;
  client.getUpdateNote( id, result => {
    //. 全記録が見える
    res.write( JSON.stringify( result, 2, null ) );
    res.end();
  });
});

/*
apiRoutes.delete( '/updatenote', function( req, res ){
  res.contentType( 'application/json' );
});
*/

apiRoutes.get( '/updatenotesByUNID', function( req, res ){
  res.contentType( 'application/json' );
  var doc_unid = req.query.doc_unid;
  client.queryUpdateNotesByUNID( doc_unid, result => {
    var updatenotes = [];

    result.forEach( updatenote0 => {
      updatenotes.push( { id: updatenote0.id, user_id: updatenote0.user_id, db_id: updatenote0.db_id, doc_unid: updatenote0.doc_unid, body: updatenote0.body, datetime: updatenote0.datetime } );
    });

    updatenotes.sort( compareByDatetime );

    //console.log( updatenotes );
    res.write( JSON.stringify( updatenotes, 2, null ) );
    res.end();
  }, error => {
    res.status( 500 );
    res.write( JSON.stringify( error, 2, null ) );
    res.end();
  });
});


app.use( '/api', apiRoutes );

app.listen( port );
console.log( "server starting on " + port + " ..." );


//. compare updatenote by datetime
function compareByDatetime( a, b ){
  const tA = a.datetime.getTime();
  const tB = b.datetime.getTime();

  var comparison = 0;
  if( tA > tB ){
    comparison = 1;
  }else if( tA < tB ){
    comparison = -1;
  }

  return comparison;
}

//. compare transaction by timestamp
function compareByTimestamp( a, b ){
  const tA = a.timestamp.getTime();
  const tB = b.timestamp.getTime();

  var comparison = 0;
  if( tA > tB ){
    comparison = 1;
  }else if( tA < tB ){
    comparison = -1;
  }

  return comparison;
}
