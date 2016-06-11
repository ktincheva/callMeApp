var userIds = {};
var eventsHandler = function (socketObj, ioObj,config) {
    var io = ioObj;
    var socket = socketObj;
    console.log("--------------Socket is connected----------");
    console.log(socket.handshake);
    console.log("--------On connection socket room is----------");
    
    var socketIds = {};
    var numClients = 0;

    var rooms = {};
    var connInfo = require('./connectionInfo');
    var events = {
        'test': {eventHandler: "testHandler"},
        'init': {eventHandler: "initHandler"},
        'message': {eventHandler: "messageHandler"},
        'peer.event': {eventHandler: "peereventHandler"},
        'switchRoom': {eventHandler: "switchroomHandler"},
        'disconnect': {eventHandler: "disconnectHandler"}
    }
    var connectionInfo = connInfo.ConnectionInfo;
    var testHandler = function(data)
    {
        console.log(data)
            socket.emit('test', 'This is a test message server answer');
    }
    var initHandler = function (data) {
        console.log("---------------- On event init data----------");
        console.log(data);
        console.log("---------------- Connection info ----------");
        console.log(connectionInfo);
        connectionInfo.sender = data.userId;

        socket.room = data.roomId;
        socket.userId = data.userId;
        
        // sockets[data.userId] = socket;
        data.status = 'connected';
        userIds[data.userId] = data;
        console.log(data.users);
       //data.usersIds = JSON.stringify(userIds);

        numClients = userIds.length;
        console.log('-----Room ' + socket.room + ' has ' + numClients + ' client(s)----');
        // var result = {'room': socket.room, 'socket': socket.id, 'user': data.username, 'users': userIds, 'status': 'connected'};
        socketIds[socket.id] = result;

        if (numClients === 0) {
            socket.join(data.roomId);
            socket.emit('created', data);
        } else if (numClients <= config.max_connections) {
            console.log("------------Joined-----");
            console.log(data);
            socket.join(data.roomId);
          //  io.sockets.in(data.roomId).emit('joined', result);
            socket.emit('joined', data);
            //console.log(socket.adapter.rooms[data.roomId].length);
            //socket.emit('full', result);
        }

        console.log('Peer connected to room', data.roomId, 'with #', socket.id);
    }
    var switchroomHandler = function (data) {
        console.log("---------------------leave curent room -----------------");
        console.log(data)
        console.log("---------------------user leaved curent room is -----------------");
        console.log(data.userId);
        console.log("--------------- socket room is --------------------");
        console.log(socket.room);
        socket.leave(socket.room);
        // sent message to OLD room
        // join new room, received as function parameter
        console.log("----------- join to new room------------------", data.roomId);
        
        socket.join(data.roomId);
        socket.room = data.roomId;
        console.log( userIds);
        console.log("----------- EMIT EVENTS------------------");
       socket.emit('updatechat', {'user': 'SERVER', 'text': 'Hello ' + data.user.userId + ' :) You have connected to room ' + data.roomId, 'roomId': data.roomId, 'userIds': userIds, 'status': 'connected'});
         console.log("----------- broad cast EMIT EVENTS------------------");
        socket.broadcast.to(data.roomId).emit('updatechat', {'user': 'SERVER', 'text': data.user.username + ' has joined the room ' + data.roomId, 'roomId': data.roomId, 'userIds': userIds, 'status': 'connected'});
        socket.broadcast.to(data.roomId).emit('updaterooms', {'roomId': data.roomId, 'userIds': userIds});
    }
    var peereventHandler = function (data) {
        connectionInfo.handleEvents(data.type, data)
        console.log("peer event hadler receved data")
        console.log(data);
        socket.broadcast.to(data.roomId).emit('peer.event', data)
    }
    var messageHandler = function (data) {
        io.sockets.in(data.room).emit('updatechat', {'text': data.text, 'roomId': data.roomId, 'users': userIds, 'user': data.user, 'status': 'connected'});
    }
    var disconnectHandler = function () {
        console.log('-----------------On disconnect-----------------------');
        connectionInfo.connectionClose = new Date();
        result = connectionInfo.getProps(connectionInfo);
        console.log(result);
        console.log(socket.userId);

        console.log((typeof userIds));
        if (((typeof userIds) === 'object' && (typeof userIds[socket.username]) === 'object') && (socket.username !== null || socket.username !== 'undefined')) {
            if (Object.keys(userIds[socket.username]).length > 0)
                delete userIds[socket.userId];
            socket.emit('userleaved', {'userId': socket.userId, 'users': userIds});
            socket.broadcast.emit('userleaved', {'userId': socket.userId, 'usersIds': userIds});
            socket.leave(socket.room);
        }
    }
    var addEventListeners = function ()
    {
        Object.keys(events).forEach(function (event, index) {
            console.log("event listener added foreach");
            console.log(index);
            console.log(events[event]);
            console.log(events[event])
            socket.on(event, function (data) {

                fn = events[event].eventHandler;
                console.log(fn);
                eval(fn)(data);
            })
        });
    }
    addEventListeners();
}

exports.eventsHandler = eventsHandler;