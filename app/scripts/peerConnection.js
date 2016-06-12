/*
 * 
 * @param {type} params
 * params of object type connection 
 *      conn = {
        roomId: roomId,
        userId: userId,
        remoteUserId: null,
        type: '',
        user: user,
        localStream: null,
        
    };
 * @returns {RTCPeerConnection|peerConn}
 */

var PeerConnection = function (params)
{
Utils.debug_log(params, "Peer Connection params");
    var iceConfig = {'iceServers': [{
                'url': 'stun:stun.l.google.com:19302'
            }, {
                'urls': 'stun:stun.l.google.com:19302'
            }]};

    var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    var connection = params;
    var localStream = connection.localStream;
    Utils.debug_log(params,"Create new RTCPeerConnection");
    var onIceCandidate = function (event) {
        Utils.debug_log(event.candidate, "Added ICE candidate");
        if (event.candidate) {
            socket.emit('peer.event', {roomId: connection.roomId, type: 'ice', ice: event.candidate, user: connection.user.usetId});
        }
    }
    var onAddStream = function (event) {
        // localVideo.classList.remove('active-video');
        Utils.debug_log(connection.remoteUserId, "on add remote stream of remote user ");
        createRemoteVideoElement(event.stream);
        ;
    }

    var onCreateSessionDescriptionError = function (error) {
        Utils.debug_log(error.toString(),'Failed to create session description: ');
    }

    var onCreateOfferSuccess = function (offer) {
        Utils.debug_log(connection,'pc1 setLocalDescription start');
        peerConn.setLocalDescription(offer, function () {
            Utils.debug_log(connection, "Set local descroption");
            socket.emit('peer.event', {roomId: connection.roomId, userId: connection.user.userId, remoteUserId: connection.remoteUserId, sdp: offer, type: 'sdp-offer', user: connection.user});
        });
    };

    var onCreateAnswerSuccess = function (answer) {
        peerConn.setLocalDescription(new RTCSessionDescription(answer), function () {
            Utils.debug_log(connection,"send the answer to the remote connection");
            $("#incomingCall").hide();
            socket.emit('peer.event', {roomId: connection.roomId, userId: connection.user.userId, remoteUserId: connection.remoteUserId, sdp: answer, type: 'sdp-answer', user: connection.user});
        });

    };
    var onCreateAnswerError = function ()
    {
        console.log("On create answer error");
    };
    var createRemoteVideoElement = function (stream)
    {
        Utils.debug_log(connection,"Set stream to the videoe element per remote user id " + connection.remoteUserId);
        var remoteVideo = document.getElementById('remote-video-' + connection.remoteUserId);
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
        console.log
        peerConn.addIceCandidate(cand);
    }
    peerConn.sendOffer = function (connection)
    {
        Utils.debug_log(connection.remoteUserId, 'Send offer to ' + connection.remoteUserId + ' on peer connection ' + peerConn);
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

