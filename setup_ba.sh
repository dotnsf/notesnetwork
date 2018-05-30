#!/bin/bash

composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName notes-network

composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ./api/notes-network.bna --file ~/admin@notes-network.card

composer card import --file ~/admin@notes-network.card

composer network ping --card admin@notes-network


