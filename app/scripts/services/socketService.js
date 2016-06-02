'use strict';
CallMe.factory('socketService', function ($sce, $location, config, $q) {
    
    var users = {};
    var status = '';
    
    var peer = null;
    var peers = [];
    
    var videoConstraints = {
        video: {width: {exact: 320}, height: {exact: 240}},
    }
    
    var localVideo = document.getElementById('local-video');
    var connection = {};
    
    
   var localStream = null; 
    
    var setConnection = function(conn)
    {
        console.log('------------------- servise set connection');
        connection = conn;
    }   
    var handleMessage = function (data) {
        console.log("Handle message function");
        switch (data.type) {
            case 'sdp-offer':
                receiveOffer(data);
                break;
            case 'sdp-answer':
                receiveAnswer(data);
                break;
            case 'ice':
                console.log("-----On ICE candidate message -----")
                console.log(data);
                if (data.ice && peer)
                {
                    var candidate = new RTCIceCandidate(data.ice);
                    peer.addIceCand(candidate);
                }
                break;
        }
    }
    
 var receiveOffer = function (data) {
        console.log("Received SDP offer data: ");
        console.log(connection);
        if (data.toId === connection.user.username)
        {
            $("#incomingCall").show();
            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.type = 'answer';
            connection.sdp = data.sdp;

            console.log(' createAnswer start to' + data.fromId);
            console.log(connection);
        }
    }
       
    var receiveAnswer = function (data)
    {
        console.log(connection);
        console.log(data);
        if (data.toId === connection.fromId)
        {

            console.log("Received SDP answer");

            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.sdp = data.sdp;
            connection.type = 'answer-received';
            peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

        }
    }
   
   var startUserMedia = function () {
        console.log("Start user media: ");
        ///////////////
        if (localStream) {
            localStream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        setTimeout(function () {
            navigator.mediaDevices.getUserMedia(
                    videoConstraints
                    ).then(
                    getStream,
                    onGetUserMediaError
                    );
        }, (localStream ? 200 : 0));
    }
    
    var getStream = function (stream) {
        localStream = stream;
        var streamUrl = window.URL.createObjectURL(stream);
        localVideo.src = streamUrl;
        localVideo.srcObject = stream;
        console.log('Add local stream to the peer connection');
        console.log(localStream);
       
        geePeer();
    }
    
    var geePeer = function ()
    {

        console.log("Get peer connection or create new if not exists");
        console.log(connection);
        getPeerConnection(connection.toId);
        
        console.log(peer);
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
        console.log('Get peer connection');
        console.log('with id ' + id);
        console.log(peer);
        if (peers[id])
        {
            console.log("Get existing PeerConnection" + id);
            peer = peers[id];
        }
        else {
            console.log("Create new PeerConnection")
            peer = new PeerConnection(localStream, connection, socket)
            
            console.log('New peer Created');
            console.log(peer);
            peers[id] = peer;
        }
        console.log(peers);
    }
    
    
      var onGetUserMediaError = function (e) {
        console.log(e);
    }
    
      localVideo.addEventListener('loadedmetadata', function () {
        console.log('Local video videoWidth: ' + this.videoWidth +
                'px,  videoHeight: ' + this.videoHeight + 'px');
    });
    return {
        
        'connection': connection,
        'localStream': localStream,
        'peer': peer,
        'peers': peers,
        'startUserMedia': startUserMedia,
        'setConnection': setConnection,
        'handleMessage': handleMessage,
    }
});