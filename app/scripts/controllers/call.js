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
    Utils.debug_log($routeParams);
        
    //var startButton = document.getElementById('startButton');
    //var socket = socketService.socket;
    var hangupButton = document.getElementById('hangupButton');
    var disconnectButton = document.getElementById('disconnectButton');
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';
    var videoConst = {
        audio: true,
        video: false,
    }
    Utils.debug_log($routeParams);
    $scope.user = {username: $routeParams.userId};
    $scope.message = {text: ""};
    $scope.connection = {};

    $scope.connection.socketid = socket.id;
    $scope.connection.user = {'username': $scope.user.username};
    $scope.connection.roomId = roomId;

     Utils.debug_log("users connected to this socket");
    Utils.debug_log(socketService.users);

    if ($routeParams.roomId)
        roomId = $routeParams.roomId;
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
        socketService.localStream.getVideoTracks()[0].stop();
        socketService.localStream.getAudioTracks()[0].stop();
        socketService.localStream = null;
        socketService.localVideo.pause();
        //localVideo.remove();
    }


    var getProfileByUsername = function ()
    {
        Utils.debug_log($scope.user.username);
        var profile = Profile.getProfileByUsernameJson($scope.user.username)
                .success(function (data) {

                    var user = $filter('filter')(data.users, function (item) {

                        return item.username === $scope.user.username;
                    })[0];

                    Utils.debug_log("Get user profileByUserName");
                    Utils.debug_log(user);
                    if (user)
                        $scope.init(user);

                    // should send data to the server
                })
                .error(function (data) {
                    //shpould log errors
                    Utils.debug_log(data);
                })
        Utils.debug_log(profile.username);

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


    $scope.createImageUrl = function (data)
    {

        angular.forEach(data, function (value, key)
        {
            Utils.debug_log(value);
            $scope.message.text += '<a href = "' + config.siteUrl + '/image_' + value.photo_sid + '_1.jpg"> click to see picture </a>';
        });

    }

    $scope.init = function (data) {
        $('#chat_rooms').show();
        socket.emit('init', {room: roomId, username: $scope.user.username, profile: data});

        Utils.debug_log("-------------------------- init function --------------------------");
        Utils.debug_log($scope);
        // when the client hits ENTER on their keyboard
        $('.message').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('#datasend').focus().click();
            }
        });
    };

    var updateUsersConnected = function (users, status) {
        Utils.debug_log("------------ Socket service update users connected------------------")
        $scope.users = users;
        $scope.status = status;
        $scope.$apply();
    }

    hangupButton.disabled = true;
    hangupButton.onclick = hangup;
    // userMediaButton.onclick = socketService.startUserMedia;
    disconnectButton.onclick = disconnect;
    //sendOfferToAll.onclick = sendOfferToAll;

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
        Utils.debug_log(socket);
        Utils.debug_log('switch to room: ' + room)

        socket.emit('switchRoom', {room: room, username: $scope.user.username});
    }

    $scope.sendOffer = function (toId) {
        Utils.debug_log('Starting call to');
        Utils.debug_log(toId);
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
            socketService.startUserMedia();
            appendRemoteVideoElement(toId);

        } else {
            errors.push("Missing user name");
        }
    }
    $scope.formdata = new FormData();
    $scope.sendImages = function ($files)
    {
        Utils.debug_log($files);
        angular.forEach($files, function (value, key) {
            Utils.debug_log('file: ' + value + ' key ' + key);
            $scope.formdata.append(key, value);
        });
    }
    $scope.uploadImages = function ()
    {
        imagesUpload.uploadImages($scope.formdata)
                .then(function (data) {
                    Utils.debug_log($scope.message);
                    $scope.createImageUrl(data);

                })
                .catch(function (error) {
                    //shpould log errors
                    Utils.debug_log(error);
                })
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
    
    $scope.startUserMedia = function()
    {
        console.log(videoConst);
        socketService.setVideoConstraints(videoConst);
        socketService.startUserMedia();
    }

    getProfileByUsername();
    //$scope.init();
});
