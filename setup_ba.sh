#!/bin/bash

composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName notes-network

composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ./api/notes-network.bna --file ~/PeerAdmin@hlfv1.card

composer network ping --card admin@notes-network


