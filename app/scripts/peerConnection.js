var PeerConnection = function (localStream, connection)
{

    var iceConfig = {'iceServers': [{
                'url': 'stun:stun.l.google.com:19302'
            }, {
                'urls': 'stun:stun.l.google.com:19302'
            }]};

    var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    var connection = connection;
   
    console.log(socket)
    console.log("Create new RTCPeerConnection");


    var onIceCandidate = function (event) {
        console.log(event.candidate);
        console.log(socket);
        if (event.candidate) {
            socket.emit('msg', {room: connection.roomId, type: 'ice', ice: event.candidate, user: connection.user.username});
        }
    }
    var onAddStream = function (event) {
        // localVideo.classList.remove('active-video');
        console.log("on add remote stream of remote user " + connection.toId);
        console.log(event.stream);
        createVideoElement(event.stream);
        ;
    }

    var onCreateSessionDescriptionError = function (error) {
        console.log('Failed to create session description: ' + error.toString());
    }

    var onCreateOfferSuccess = function (offer) {
        console.log('pc1 setLocalDescription start');
        peerConn.setLocalDescription(offer, function () {
            console.log(connection);

            socket.emit('msg', {room: connection.roomId, fromId: connection.user.username, toId: connection.toId, sdp: offer, type: 'sdp-offer', user: connection.user.username});
        });
    };

    var onCreateAnswerSuccess = function (answer) {
        peerConn.setLocalDescription(new RTCSessionDescription(answer), function () {
            console.log("send the answer to the remote connection");
            $("#incomingCall").hide();
            console.log(connection);

            socket.emit('msg', {room: connection.roomId, fromId: connection.user.username, toId: connection.toId, sdp: answer, type: 'sdp-answer', user: connection.user.username});
        });

    };
    var onCreateAnswerError = function ()
    {
        console.log("On create answer error");
    };
    var createVideoElement = function (stream)
    {
        console.log("Set stream to the videoe element per remote user id " + connection.toId);
        var remoteVideo = document.getElementById('remote-video-' + connection.toId);
        console.log(remoteVideo);
        /*var vid = document.createElement("video");
         ;*to
         vid.src = windowv.URL.createObjectURL(event.stream);*/
        remoteVideo.src = window.URL.createObjectURL(stream)
        remoteVideo.srcObject = stream;

    }

    peerConn = new RTCPeerConnection(iceConfig)
    peerConn.onicecandidate = onIceCandidate;
    peerConn.onaddstream = onAddStream;
    peerConn.addStream(localStream);
    console.log(peerConn);
    peerConn.addIceCand = function (cand)
    {
        peerConn.addIceCandidate(cand);
    }
    peerConn.sendOffer = function (connection)
    {
        console.log('Send offer to ' + connection.toId + ' on peer connection ' + peerConn);
        peerConn.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
    }

    peerConn.sendAnswer = function (connection)
    {
        console.log('Send answer to ' + connection.fromId + ' on peer connection ' + peerConn);
        var rtcOffer = new RTCSessionDescription(connection.sdp);
        peerConn.setRemoteDescription(rtcOffer, function () {
            peerConn.createAnswer(onCreateAnswerSuccess, onCreateAnswerError);
        });
    }


    peerConn.connectionClose = function ()
    {
        peerConn.close();
        peerConn = null;
    }

    console.log(peerConn);
    return peerConn;
}

