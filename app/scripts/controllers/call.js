'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:CallCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */


CallMe.controller('CallCtrl', function ($routeParams, $scope, $filter, config, imagesUpload, Profile, socketService) {
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
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';
    var profiles = {};
    var profile = {};

    var videoConst = {
        audio: true,
        video: false,
    }
    var offerOpt = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 0
    };
    if ($routeParams.roomId)
        roomId = $routeParams.roomId;
    $scope.user = {username: $routeParams.userId};
    $scope.message = {text: ""};
    $scope.connection = {};
    $scope.room = roomId;
    $scope.connection.socketid = socket.id;
    $scope.connection.user = {'username': $scope.user.username};
    $scope.connection.roomId = roomId;

    Utils.debug_log(socketService.users, "users connected to this socket");


    socketService.setConnection($scope.connection);

// toId == received fromId



    var hangup = function () {
        Utils.debug_log("User Hangup");
        Utils.debug_log($scope.user.username);

        socket.emit('userleave', {room: roomId, username: $scope.user.username})

        hangupButton.disabled = true;
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
        //socketService.localStream.getVideoTracks()[0].stop();
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

                    var user = $filter('filter')(data.users, function (item) {
                        return item.username === username;
                    })[0];
                    Utils.debug_log(user, "User connected receided data");
                    profile = user;
                    Utils.debug_log(profile, "Ser user profile with data received")
                    $scope.init(user)
                    // should send data to the server
                })
                .error(function (data) {
                    //shpould log errors
                    Utils.debug_log(data);
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

    var updateRooms = function (data) {
        Utils.debug_log(data, "Update rooms");
        $scope.current_room = data.room;
        updateUsersConnected(data.users, 'conneted')
    }
    var updateChat = function (data)
    {
        Utils.debug_log(data, "update chat message");
        $('#conversation-' + data.room).append('<b>' + data.user + ':</b>  <pre>' + $filter('smilies')(data.text) + '</pre>');
        updateUsersConnected(data.users, 'conneted')
    }
    var updateUsersConnected = function (users, status) {
        Utils.debug_log(users, "------------ Socket service update users connected------------------")
        $scope.users_connected = users;
        $scope.status = status;
        $scope.$apply();
    }
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

        socket.emit('init', {room: roomId, username: $scope.user.username, profile: data});
        // when the client hits ENTER on their keyboard
        $('.message').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('#datasend').focus().click();
            }
        });
    };



    hangupButton.disabled = true;
    hangupButton.onclick = hangup;
    // userMediaButton.onclick = socketService.startUserMedia;
    disconnectButton.onclick = disconnect;


    $scope.rooms = rooms;
    $scope.config = config;

    $scope.login = function ()
    {

        Utils.debug_log("login")
        if (!$scope.user.username)
        {
            Utils.debug_log("Username is empty!!!");
            $scope.errors.push("Empty username");
            return false;
        }
        else {
            getProfileByUsername();
        }

        // socket.emit('adduser', $scope.user.username);
    }
    $scope.switchRoom = function (room) {
        console.log('switch to room: ' + room)
        socket.emit('switchRoom', {room: room, username: $scope.user.username});
    }
    $scope.sendOffer = function (toId) {
        Utils.debug_log(toId, 'Starting call to');
        $scope.connection.fromId = $scope.user.username;
        $scope.connection.toId = toId;
        $scope.connection.type = 'offer'
        socketService.setConnection($scope.connection);
        if ($scope.user.username && $scope.connection.toId)
        {
            hangupButton.disabled = false;
            Utils.debug_log($scope.user.username + 'send createOffer start');
            // getPeerConnection(connection.toId);
            socketService.setVideoConstraints(videoConst);
            socketService.setOfferOptions(offerOpt);
            socketService.startUserMedia();
            appendRemoteVideoElement(toId);

        } else {
            errors.push("Missing user name");
        }
    }
    $scope.sendAnswer = function ()
    {
        Utils.debug_log("Send Answer to");
        Utils.debug_log($scope.connection);
        $scope.remoteUser = $scope.connection.toId;
        socketService.startUserMedia();
        appendRemoteVideoElement($scope.connection.toId)

        Utils.debug_log("Receive offer: ");
        Utils.debug_log($scope.connection.type);
    };

    $scope.startUserMedia = function ()
    {
        console.log(videoConst);
        socketService.setVideoConstraints(videoConst);
        socketService.startUserMedia();
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

    getProfileByUsername($routeParams.userId);
    $scope.switchRoom(roomId)
    angular.element(document).ready(function () {

        var meeting = $(".participants").filter(function (index) {
            console.log(index);
            return index == 0;
        });
        meeting.removeClass("deactivated").addClass("active");
        Utils.debug_log(meeting, "When document ready");
    });

    AppEmitter.on('msg', function (data) {
        Utils.debug_log(data, "Peer connection messages handler");
        socketService.handleMessage(data);
    });
    AppEmitter.on('updaterooms', function (data) {
        Utils.debug_log(data, "On update rooms event received")
        updateRooms(data);
    });

    AppEmitter.on('updateusers', function (data) {
        Utils.debug_log(data, "On update users event reseived")
        updateUsersConnected(data.users, data.status)
    });
    AppEmitter.on('updatechat', function (data) {
        Utils.debug_log(data, "On opdate chat message reveived");
        updateChat(data);
    });
});