'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:CallCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */


CallMe.controller('CallCtrl', function ($routeParams, $scope, $filter, config, imagesUpload, Profile, socketService, socketClient) {
    this.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
    ];
    Utils.debug_log($routeParams, "Route parameters received");

    //var startButton = document.getElementById('startButton');
    //var socket = socketService.socket;
    var hangupButton = document.getElementById('hangupButton');
    var disconnectButton = document.getElementById('disconnectButton');
    var localVideo = document.getElementById('local-video');
    var localStream = null;

    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';
    var profiles = {};
    var profile = {};


    var roomId = $routeParams.roomId;
    var userId = $routeParams.userId
    var videoConstr = {
        audio: true,
        video: false,
    }
    var offerOpt = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 0
    };
    var user = {userId: $routeParams.userId, username: userId, media: {camera: false, microphone: false}}

    /*
     * data to send to events
     */
    var conn = {
        roomId: roomId,
        userId: userId,
        remoteUserId: null,
        type: '',
        user: user,
        localStream: null,
    };
    /* should ne take from config file per controller
     * 
     * @type type
     */

    socket.emit("test", "This is a test message sended");

    $scope.rooms = rooms;
    $scope.config = config
    $scope.user = user;
    $scope.message = {text: ""};
    $scope.muted = false;

    $scope.room = roomId;
    $scope.errors = [];

    Utils.debug_log(socketService.users, "users connected to this socket");

    /* 
     * set some 
     * socket service constrain and parameters 
     */
    socketService.setConnection(conn);
    socketService.setOfferOptions(offerOpt);

////////////////////////////////////
    socket.emit('init', conn);

    var hangup = function () {
        Utils.debug_log("User Hangup");
        Utils.debug_log($scope.user.userId);

        socket.emit('userleave', {room: roomId, userId: $scope.user.userId})

        hangupButton.disabled = true;
        localStream = null;
        //socket.disconnect();
        socketService.peer.connectionClose();
        stopVideo();
    }

    var disconnect = function ()
    {
        hangup();
        // socket.disconnect();
    }
    var stopVideo = function ()
    {
        //socketService.localStream.getVideoTracks()[0].stop();
        localStream.getAudioTracks()[0].stop();
        localStream = null;
        localVideo.pause();
        //localVideo.remove();
    }

    var getProfileByUsername = function (username)
    {
        Utils.debug_log(username, "Get profile of user connected");
        Profile.getProfileByUsernameJson(username)
                .success(function (data) {
                    user = $filter('filter')(data.users, function (item) {
                        return item.username === username;
                    })[0];
                    user.media = {camera: false, microphone: false};
                    Utils.debug_log(user, "User connected receided data");
                    Utils.debug_log(profile, "Set user profile with data received")
                    $scope.init(user)
                    // should send data to the server
                })
                .error(function (data) {
                    //shpould log errors
                    Utils.debug_log(data, "Get user's profile data by username");
                });
    }

    var appendRemoteVideoElement = function (id)
    {
        var remoteVideo = document.getElementById('remote-video-' + id);
        if (!remoteVideo)
        {
            var videoWrapper = document.getElementById("remote-videos-container");
            var video = document.createElement("video");
            video.setAttribute("id", "remote-video-" + id);
            video.setAttribute("class", "remote-video active-video");
            video.style.verticalAlign = "middle";
            videoWrapper.appendChild(video)
            video.autoplay = true;

            remoteVideo = document.getElementById("remote-video-" + id)
            remoteVideo.addEventListener('loadedmetadata', function () {
                remoteVideo.play();
                Utils.debug_log('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });
        }
    }



    var getStream = function (stream) {
        localStream = stream;
        Utils.debug_log($scope.errors, "Scope errors");
        if ($scope.errors && localStream)
            $scope.errors = {};
        $scope.$apply();
        localVideo.src = window.URL.createObjectURL(stream);
        localVideo.srcObject = stream;
        localVideo.play();
        // user.media.microphone = true;
        Utils.debug_log(localStream, 'Add local stream to the peer connection');
    }

    var onGetUserMediaError = function (e) {
        Utils.debug_log(e, "On get media stream srror");
        $scope.errors.push({type: 'warning', msg: "Cannot start user media"});
    }

    localVideo.addEventListener('loadedmetadata', function () {
        Utils.debug_log(this, 'Local video videoWidth: ' + this.videoWidth +
                'px,  videoHeight: ' + this.videoHeight + 'px');
    });

    $scope.createImageUrl = function (data)
    {

        angular.forEach(data, function (value, key)
        {
            Utils.debug_log(value);
            $scope.message.text += '<a href = "' + config.siteUrl + '/image_' + value.photo_sid + '_1.jpg"> click to see picture </a>';
        });
    }

    $scope.init = function (data) {
        Utils.debug_log(data, "Init scope when get user profile");
        $scope.user = data;
        $scope.schedule = data.schedule;
        conn.user = user
        socket.emit('init', conn);

        // when the client hits ENTER on their keyboard
        $('.message').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('#datasend').focus().click();
            }
        });
    };

    $scope.switchRoom = function (room) {
        console.log('switch to room: ' + room)
        socket.emit('switchRoom', {roomId: room, userId: userId, user: user});
    }

    $scope.sendOffer = function (remoteUserId) {
        Utils.debug_log(remoteUserId, ' Starting call to remote the user');
        conn.remoteUserId = remoteUserId;
        if (userId && remoteUserId)
        {
            Utils.debug_log(localStream, "sendOffer");
            if (!localStream)
            {
                $scope.errors.push({type: 'danger', msg: 'The microhone is not connected'});
                return false;
            }
            conn.remoteUserId = remoteUserId;
            conn.localStream = localStream;
            conn.type = 'offer';
            hangupButton.disabled = false;
            Utils.debug_log(conn, 'send createOffer start');

            socketService.setConnection(conn);
            socketService.createOffer()
            appendRemoteVideoElement(remoteUserId);

        } else {
            $scope.errors.push({type: 'danger', msg: '"Missing user name"'});

            return false;

        }

    }

    $scope.sendAnswer = function ()
    {
        Utils.debug_log(conn, "Send Answer to");
            conn.localStream = localStream;
            conn.type = 'answer';
        socketService.setConnection(conn);
        socketService.createOffer()
        appendRemoteVideoElement(conn.remoteUserId)
    };

    $scope.startUserMedia = function ()
    {
        Utils.debug_log(localStream, "Start user media: ");

        ///////////////
        if (localStream) {
            localStream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        setTimeout(function () {
            navigator.mediaDevices.getUserMedia(videoConstr)
                    .then(
                            getStream,
                            onGetUserMediaError
                            );
        }, (localStream ? 200 : 0));
    }

    $scope.muteMicrophone = function (val)
    {
        Utils.debug_log(val, "Mute microphone");
        if (localStream)
        {
            $scope.errors = {};
            if (val == false)
            {
                localStream.getAudioTracks()[0].enabled = true;
                user.media.microphone = true;

            } else {
                localStream.getAudioTracks()[0].enabled = false;
                user.media.microphone = false;
            }
        } else {
            Utils.debug_log(localStream, "User media is not started");
            $scope.errors.push({type: 'warning', msg: "User media is not started"});
        }

    }


    $scope.showParticipants = function (meeting_id)
    {
        $scope.switchMeeting(meeting_id)
        return $filter('filter')($scope.user.schedule, function (meeting) {
            return meeting.meeting_id === meeting_id;
        })[0];
    }

    $scope.switchMeeting = function (id)
    {
        var meeting = $(".meeting_" + id);
        Utils.debug_log(id, "show participants");

        var meetings = $(".participants");
        meetings.each(function () {
            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
            }
            $(this).addClass("deactivated");
        })
        meeting.removeClass("deactivated");
        meeting.addClass("active");
    }


    hangupButton.disabled = true;
    hangupButton.onclick = hangup;
    // userMediaButton.onclick = socketService.startUserMedia;
    disconnectButton.onclick = disconnect;

    getProfileByUsername(userId);
    $scope.switchRoom(roomId)

    /* 
     * define socket client event habdlers
     */
    var updateRooms = function (data) {
        Utils.debug_log(data, "Update rooms");
        $scope.current_room = data.room;
        updateUsersConnected(data.userIds, 'conneted')
    }

    var updateChat = function (data)
    {
        Utils.debug_log(data, "update chat message");
        $('#conversation-' + data.roomId).append('<b>' + data.user + ':</b>  <pre>' + $filter('smilies')(data.text) + '</pre>');
        updateUsersConnected(data.userIds, data.status)
    }

    var updateUsersConnected = function (users, status) {
        Utils.debug_log(users, "------------ Socket service update users connected------------------")
        $scope.users_connected = users;
        $scope.status = status;
        $scope.$apply();
    }

    var updateTest = function (data)
    {
        Utils.debug_log(data, "This is a test message received form server");
        $('#conversation-room1').append('<b> SERVER: </b>  <pre>' + $filter('smilies')(data) + '</pre>');
    }
    var handleMessage = function (data)
    {
        if (data.type == "sdp-offer")
            conn.remoteUserId  = data.userId
        socketService.handleMessage(data);
    }
    /*
     * socket service event options
     * should be moved to congif
     */

    var options =
            {
                eventHandlers: {updateTest: updateTest, updateChat: updateChat, updateRooms: updateRooms, updateUsersConnected: updateUsersConnected, handleMessage: handleMessage},
                events: {
                    'test': {eventHandler: 'updateTest'},
                    'joined': {eventHandler: 'updateChat'},
                    'created': {eventHandler: 'updateChat'},
                    'updatechat': {eventHandler: 'updateChat'},
                    'updaterooms': {eventHandler: 'updateRooms'},
                    'updateusers': {eventHandler: 'updateUsersConnected'},
                    'peer.event': {eventHandler: 'handleMessage'}
                }};

    var client = new socketClient(options);

    Utils.debug_log(client, "New socket client should be ready ...");

    ///////////
    angular.element(document).ready(function () {

        var meeting = $(".participants").filter(function (index) {
            console.log(index);
            return index == 0;
        });
        meeting.removeClass("deactivated").addClass("active");
        Utils.debug_log(meeting, "When document ready");
    });

});