# notesnetwork


## Overview


## How to deploy business Network from API server.

- Prepare API server with Ubuntu 16.04.

- Login to that API Server(Ubuntu 16.04) with SSH or terminal

- (Once)Install Node.js(V6.x) and npm

    - `$ sudo apt-get install -y nodejs npm`

    - `$ sudo npm cache clean`

    - `$ sudo npm install n -g`

    - `$ sudo n list`

        - find latest 6.x.x version, for example 6.12.3

    - `$ sudo n 6.12.3`

    - `$ sudo apt-get purge nodejs npm`

- (Once)Install composer-cli

    - `$ npm install -g composer-cli`

- (Once)Prepare Hyperledger Fabric v1.

    - http://dotnsf.blog.jp/archives/1069641731.html

- (Once)Create BNC(Business Network Card) for PeerAdmin@hlfv1

    - `$ cd ~/fabric/; ./createPeerAdminCard.sh`

    - `$ cp /tmp/PeerAdmin@hlfv1.card ./`

- (Once)Import Created Business Network Card for PeerAdmin@hlfv1

    - `$ composer card import --file PeerAdmin@hlfv1.card`

- (Once)Import BNC for admin@notes-network

    - `$ cd **/notesnetwork/api`

    - `$ composer card import --file admin@notes-network.card`

- (Everytime after starting Hyperledger Fabric)Install notes-network runtime

    - `$ composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName notes-network`

- (Everytime after starting Hyperledger Fabric)Start notes-network with BNA

    - `$ composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile notes-network.bna --file PeerAdmin@hlfv1.card`

- (Everytime after starting Hyperledger Fabric)Ping to Business Network with admin@myvc-network(for confirmation)

    - `$ composer network ping --card admin@notes-network`

## How to install/run Platform API( and API Document) in API Server

- Prepare API Server with Ubuntu 16.04

- Login to that API Server(Ubuntu 16.04) with SSH or terminal

- Install Node.js(V6.x) and npm

    - See above for detailed commands

- Prepare for folowing composer commands

    - `$ cd **/notesnetwork/api`

- Install dependencies

    - `$ npm install`

- (Optional)Edit public/doc/swagger.yaml host value for Swagger API Document, if needed.

- (Optional)Edit setttings.js, if needed.

    - exports.cardName : Business Network Card name for Hyperledger Fabric access

    - exports.basic_username : Username for Basic authentication

    - exports.basic_password : Password for Basic authentication

    - exports.cloudant_db : Database name of IBM Cloudant, which would store all update information. Leave blank if you don't want to store them.

    - exports.cloudant_username : Username for IBM Cloudant

    - exports.cloudant_password : Password for IBM Cloudant


- Run app.js with Node.js

    - `$ node app`


## Licensing

This code is licensed under MIT.

https://github.com/dotnsf/myvc/blob/master/MIT-LICENSE.txt


## Copyright

2018 K.Kimura @ IBM Japan all rights reserved.
