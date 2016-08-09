'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:CallCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */

CallMe.controller('videoCallCtrl', function ($sce, $location, $routeParams, $scope, $filter, config, imagesUpload, Profile, socketService, video, ngVideoOptions) {
    this.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
    ];

    Utils.debug_log($routeParams, "Route parameters received");
    socket.emit("test", "This is a test message sended");

    //var startButton = document.getElementById('startButton');
    //var socket = socketService.socket;
    /*var hangupButton = document.getElementById('hangupButton');
     var disconnectButton = document.getElementById('disconnectButton');
     */

    var localVideo = document.getElementById('local-video');
    var localStream = null;
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = $routeParams.roomId;
    var userId = $routeParams.userId;

    var videoConstr = {
        audio: true,
        video: true,
    }
    var offerOpt = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
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

    $scope.rooms = rooms;
    $scope.config = config
    $scope.user = user;
    $scope.message = {text: ""};
    $scope.muted = false;

    $scope.roomId = roomId;
    $scope.errors = [];


    Utils.debug_log(socketService.users, "users connected to this socket");

    socketService.setConnection(conn);
    socketService.setOfferOptions(offerOpt);

// toId == received fromId


    var hangup = function () {
        console.log("User Hangup");
        console.log($scope.user.username);
        socket.emit('userleave', {room: roomId, username: $scope.user.username})
        //hangupButton.disabled = true;
        socketService.localStream = null;
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
        socketService.localStream.getVideoTracks()[0].stop();
        socketService.localStream.getAudioTracks()[0].stop();
        socketService.localStream = null;
        socketService.localVideo.pause();
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
                    user.media = {camera: true, microphone: true};
                    Utils.debug_log(user, "User connected receided data");
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
                Utils.debug_log(video, 'Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });
        }
    }


    var updateChat = function (data)
    {
        Utils.debug_log(data, "update chat message");
        $('#conversation-' + data.roomId).append('<b>' + data.user + ':</b>  <pre>' + $filter('smilies')(data.text) + '</pre>');
        updateUsersConnected(data.userIds, data.status)
    }

    var updateRooms = function (data) {
        console.log("Update rooms ");
        console.log($scope.users);
        console.log(data.room);
        $scope.current_room = data.room;
        updateUsersConnected(data.userIds, 'conneted')
    }

    var updateUsersConnected = function (users, status) {
        console.log("------------ Update users connected------------------")
        console.log(users)
        $scope.users = users;
        $scope.status = status;
        $scope.$apply();
    }
    var handleMessage = function (data)
    {
        if (data.type == "sdp-offer")
            conn.remoteUserId = data.userId
        socketService.handleMessage(data);
    }
    var updateTest = function (data)
    {
        Utils.debug_log(data, "This is a test message received form server");
        $('#conversation-room1').append('<b> SERVER: </b>  <pre>' + $filter('smilies')(data) + '</pre>');
    }


    // hangupButton.disabled = true;
    //hangupButton.onclick = hangup;
    // userMediaButton.onclick = socketService.startUserMedia;
    //disconnectButton.onclick = disconnect;
    //sendOfferToAll.onclick = sendOfferToAll;

    $scope.rooms = rooms;
    $scope.config = config;

    $scope.login = function ()
    {

        console.log("login")
        if (!$scope.user.username)
        {
            console.log("Username is empty!!!");
            $scope.errors.push("Empty username");
            return false;
        }
        else {
            getProfileByUsername();
        }

        // socket.emit('adduser', $scope.user.username);
    }
    $scope.createImageUrl = function (data)
    {

        angular.forEach(data, function (value, key)
        {
            console.log(value);
            $scope.message.text += '<a href = "' + config.siteUrl + '/image_' + value.photo_sid + '_1.jpg"> click to see picture </a>';
        });

    }

    $scope.init = function (data) {
        $('#chat_rooms').show();
        Utils.debug_log(data, "Init scope when get user profile");
        $scope.user = data;
        conn.user = user
        socket.emit('init', conn);
        $scope.startUserMedia();
        // when the client hits ENTER on their keyboard
        $('.message').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('#datasend').focus().click();
            }
        });
    };
    $scope.switchRoom = function (room) {
        Utils.debug_log(room, 'Switch room')
        socket.emit('switchRoom', {roomId: room, userId: userId, user: user});
    }

    $scope.senddata = function (data, room) {
        Utils.debug_log(data, "Send message data")
        $('#data-' + room).html('');
        data = {'roomId': room, 'userId': userId, 'text': data.text};
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('message', data);
    }
    $scope.formdata = new FormData();
    $scope.sendImages = function ($files)
    {
        console.log($files);
        angular.forEach($files, function (value, key) {
            console.log('file: ' + value + ' key ' + key);
            $scope.formdata.append(key, value);
        });
    }
    $scope.uploadImages = function ()
    {
        imagesUpload.uploadImages($scope.formdata)
                .then(function (data) {
                    console.log($scope.message);
                    $scope.createImageUrl(data);

                })
                .catch(function (error) {
                    //shpould log errors
                    console.log(error);
                })
    }
    $scope.sendOffer = function (remoteUserId) {
        Utils.debug_log(remoteUserId, ' Starting call to remote the user');
        conn.remoteUserId = remoteUserId;
        if (userId && remoteUserId)
        {
            Utils.debug_log(localStream, "sendOffer");
            if (!localStream)
            {
                $scope.errors.push({type: 'danger', msg: 'The user media device is not connected'});
                return false;
            }
            conn.remoteUserId = remoteUserId;
            conn.localStream = localStream;
            conn.type = 'offer';
            //hangupButton.disabled = false;
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
    getProfileByUsername(userId);

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
    //$scope.init();
});
