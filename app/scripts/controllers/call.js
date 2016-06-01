'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:CallCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */

CallMe.controller('CallCtrl', function ($sce, $location, $routeParams, $scope, $filter, config, imagesUpload, Profile, socketService) {
    this.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
    ];
    console.log($routeParams);
    //var startButton = document.getElementById('startButton');
    var socket = socketService.socket;
    var hangupButton = document.getElementById('hangupButton');
    var disconnectButton = document.getElementById('disconnectButton');
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';

    $scope.user = {username: $routeParams.userId};
    $scope.message = {text: ""};
    $scope.connection = {};
    
    $scope.connection.socket = socket;
    $scope.connection.user = {'username': $scope.user.username};
    $scope.connection.roomId = roomId;  
    
    
    console.log("users connected to this socket");
    console.log(socketService.users);



    if ($routeParams.roomId)
        roomId = $routeParams.roomId;
    socketService.setConnection($scope.connection);
    
// toId == received fromId




    $scope.sendOffer = function (toId) {
        console.log('Starting call to');
        console.log(toId);
        $scope.connection.fromId = $scope.user.username;
        $scope.connection.toId = toId;
        $scope.connection.type = 'offer'
        socketService.setConnection($scope.connection);
        if ($scope.user.username && $scope.connection.toId)
        {
            hangupButton.disabled = false;
            console.log($scope.user.username+'send createOffer start');
            // getPeerConnection(connection.toId);
            
            socketService.startUserMedia();
            appendRemoteVideoElement(toId)
            $scope.$apply
        } else {
            errors.push("Missing user name");
        }

    }
    var hangup = function () {
        console.log("User Hangup");
        console.log($scope.user.username);
        socket.emit('userleave', {room: roomId, username: $scope.user.username})
        hangupButton.disabled = true;
        socket.localStream = null;
        //socket.disconnect();
        socket.peer.connectionClose();
        stopVideo();
    }
    var disconnect = function ()
    {
        hangup();
        // socket.disconnect();
    }
    var stopVideo = function ()
    {
        socket.localStream.getVideoTracks()[0].stop();
        socket.localStream.getAudioTracks()[0].stop();
        socket.localStream = null;
        socket.localVideo.pause();
        //localVideo.remove();
    }

    
    var getProfileByUsername = function ()
    {
        console.log($scope.user.username);

        var profile = Profile.getProfileByUsernameJson($scope.user.username)
                .success(function (data) {

                    var user = $filter('filter')(data.users, function (item) {

                        return item.username === $scope.user.username;
                    })[0];

                    console.log("Get user profileByUserName");
                    console.log(user);
                    if (user)
                        $scope.init(user);

                    // should send data to the server
                })
                .error(function (data) {
                    //shpould log errors
                    console.log(data);
                })
        console.log(profile.username);

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
                console.log('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });
        }
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
        socket.emit('init', {room: roomId, username: $scope.user.username, profile: data});
       
        console.log("-------------------------- init function --------------------------");
        console.log($scope);
        // when the client hits ENTER on their keyboard
        $('.message').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('#datasend').focus().click();
            }
        });
    };

    var updateUsersConnected = function (users, status) {
        console.log("------------ Socket service update users connected------------------")
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
    $scope.switchRoom = function (room) {
        console.log(socket);
        console.log('switch to room: ' + room)

        socket.emit('switchRoom', {room: room, username: $scope.user.username});
    }
    $scope.senddata = function (data, room) {
        console.log("Send message data")
        console.log(data);
        $('#data-' + room).html('');
        data.room = room
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', data);
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

    $scope.sendAnswer = function ()
    {
        console.log("Send Answer to");
        console.log($scope.connection);
        $scope.remoteUser = $scope.connection.toId;
        socketService.startUserMedia();
        appendRemoteVideoElement($scope.connection.toId)
        $scope.$apply();
        console.log("Receive offer: ");
        console.log($scope.connection.type);
    };



    socket.on('updatechat', function (username, data) {
        console.log("Update chat message");
        console.log($filter('smilies')(data.text));
        $('#conversation-' + data.room).append('<b>' + username + ':</b>  <pre>' + $filter('smilies')(data.text) + '</pre>');
        $scope.$apply();
    });
    socket.on('updaterooms', function (rooms, current_room, users) {
        console.log("Update rooms ");

        $scope.users = users.users;
        $scope.$apply();
        console.log($scope.users);
        console.log(current_room);
        $('.current_room').html(current_room)
        $scope.current_room = current_room;
    });
    socket.on('created', function (data)
    {
        console.log('room created');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    });

    socket.on('joined', function (data)
    {
        console.log('user ' + data.username + ' joined to room ' + data.room);
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    });

    socket.on('ready', function (data)
    {
        console.log('room joined: ');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    });

    socket.on('fill', function (data) {
        console.log('socket fill: ');
        console.log(data.socket);
        updateUsersConnected(data.users, 'conneted')
    });

    socket.on('userleaved', function (data)
    {
        console.log('userleaved');
        console.log(data);

        if (data.status)
            status = data.status
        updateUsersConnected(data.users, status)
    });


    socket.on('connect', function () {
        console.log("Connect to the chat")
        status = 'connected';
    });

    socket.on('connected', function (data) {
        console.log("If Succcesfuly connected update users connected");
        console.log(data);
        updateUsersConnected(data.users, 'connected')
    });


    getProfileByUsername();

    //$scope.init();
});
