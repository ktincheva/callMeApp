'use strict';
CallMe.factory('socketService', function ($sce, $location, config, $q) {

    var users = {};
    var status = '';

    var peer = null;
    var peers = [];

    var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };


    var connection = {};

    var localStream = null;
    var remoteStreams = [];
    var setConnection = function (conn)
    {
        Utils.debug_log(conn, '------------------- servise set connection');
        connection = conn;
    }

    var setOfferOptions = function (options)
    {
        Utils.debug_log(options, "Set offer options");
        offerOptions = options;
    }
    var setVideoConstraints = function (videoConstr)
    {
        Utils.debug_log(videoConstr, "Set video consttants");
        videoConstraints = videoConstr;
    }
    var handleMessage = function (data) {
        Utils.debug_log(data, "Handle message function received data");
        switch (data.type) {
            case 'sdp-offer':
                receiveOffer(data);
                break;
            case 'sdp-answer':
                receiveAnswer(data);
                break;
            case 'ice':
                Utils.debug_log(data, "On ICE candidate event received data");
                if (data.ice && peer)
                {
                    Utils.debug_log(peer, "Peer connection on ICE candidate event received");
                    var candidate = new RTCIceCandidate(data.ice);
                    peer.addIceCand(candidate);
                }
                break;
        }
    }
    var createOffer = function ()
    {

        Utils.debug_log(connection, 'Socket service create offer start');

        if (!connection.localStream) {
            return false;
        }
        getPeer();

    }
    var receiveOffer = function (data) {
        Utils.debug_log(data, "Received SDP offer data: ");
        Utils.debug_log(connection, "Received SDP offer connection: ");
        if (data.remoteUserId === connection.userId)
        {
            $("#incomingCall").show();
            connection.type = 'answer';
            connection.sdp = data.sdp;
            getPeer();
            Utils.debug_log(data.userId, ' createAnswer start to');
        }
    }

    var receiveAnswer = function (data)
    {
        Utils.debug_log(data, "Received SDP answer data: ");
        Utils.debug_log(connection, "Received SDP answer connection: ");
        if (data.remoteUserId === connection.userId)
        {

            console.log("Received SDP answer");
            connection.sdp = data.sdp;
            connection.type = 'answer-received';
            
            peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

        }
    }



    var getPeer = function ()
    {

        Utils.debug_log(connection, "Get peer connection or create new if not exists");
        getPeerConnection(connection.remoteUserId);
        // create video element
        if (connection.type === 'offer')
        {
            peer.sendOffer(connection)
        }
        else if (connection.type === 'answer')
        {
            peer.sendAnswer(connection);
        }

    }

    var getPeerConnection = function (id)
    {
        Utils.debug_log(id, ' get peer connection with remote user id');
        if (peers[id])
        {
            Utils.debug_log(id, "Get existing PeerConnection");
            peer = peers[id];
        }
        else {
            Utils.debug_log(id,"Create new PeerConnection");
            peer = new PeerConnection(connection)
            Utils.debug_log(peer, 'New peer created');
            peers[id] = peer;
        }
        Utils.debug_log(peers, "Existing peers connection");
    }

    return {
        'connection': connection,
        'localStream': localStream,
        'peer': peer,
        'peers': peers,
        'setConnection': setConnection,
        'handleMessage': handleMessage,
        'setOfferOptions': setOfferOptions,
        'createOffer': createOffer
    }
});