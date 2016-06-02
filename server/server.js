var express = require('express');
var expressApp = express();
var socketio = require('socket.io');
var https = require('https');
var fs = require('fs');
var uuid = require('node-uuid');

var options = {
    key: fs.readFileSync(__dirname + '/../config/ssl/server.key'),
    cert: fs.readFileSync(__dirname + '/../config/ssl/server.crt')
};
expressApp.use(express.static(__dirname + '/../app/'));

exports.run = function (config) {
    var server = https.createServer(options, expressApp);
    var userIds = {};
    server.listen(config.PORT);

    console.log("Server started!");
    console.log('Listening on', config.PORT);
    var io = socketio.listen(server, {log: true});
    var numClients = 0;
    
    var rooms = {};
    var sockets = [];
    
    io.on('connection', function (socket) {
        console.log("--------on connection socket room is----------");
        console.log(socket.room);
        socket.on('init', function (data) {
            console.log(data);
            socket.room = data.room;
            socket.username = data.username;
            console.log("current Room: " + socket.room);
            console.log("username: " + data.username);
          
            userIds[data.username] = data;
            console.log("-------------------------Socket Init----------------------------- ");            
            
            console.log("------------------------Users Ids json object---------------------");
            console.log(userIds);
            console.log("----------------------- Current Room clients----------------------");
            console.log(io.sockets.adapter.rooms[socket.room]);
            
            if (io.sockets.adapter.rooms[socket.room])
                numClients = io.sockets.adapter.rooms[socket.room].length;
            
            console.log(io.sockets.adapter.rooms[socket.room]);
            console.log('Room ' + socket.room + ' has ' + numClients + ' client(s)');
            var result = {room: socket.room, socket: socket.id, user: data.username, users: userIds};
            sockets[socket.id] = result;
            
            if (numClients === 0) {
                socket.join(data.room);
                socket.emit('created', result);

            } else if (numClients <= config.max_connections) {
                socket.join(data.room);
                io.sockets.in(data.room).emit('joined', data);
                console.log(socket.adapter.rooms[data.room].length);
                socket.emit('full', result);
            }

            console.log(io.sockets.adapter.rooms[data.room]);
            console.log('Peer connected to room', data.room, 'with #', socket.id);
        });

        socket.on('msg', function (data) {
            console.log("Message received: " + data.type);
            console.log(data);
            io.sockets.in(data.room).emit('msg', data)
        });

        socket.on('userleave', function (data)
        {
        
        });
        // when the client emits 'sendchat', this listens and executes
        socket.on('message', function (data) {
            console.log("Server: on send chat event starts", data);
            io.sockets.in(data.room).emit('updatechat', data.username ,{'text': data.text, 'room': data.room, 'users': userIds});
        });

        socket.on('switchRoom', function (data) {
            // leave the current room (stored in session)
            console.log("---------------------leave curent room -----------------");
            console.log(data.room)
            console.log("---------------------user leaved curent room is -----------------");
            console.log(data.username);
            socket.leave(socket.room);
            // sent message to OLD room
            io.sockets.in(data.room).emit(data.room).emit('updatechat', 'SERVER', {'text': data.username + ' has left the room '+ socket.room, 'room': data.room, 'users': userIds});
            // join new room, received as function parameter
            console.log("----------- join to new room------------------");
            
            socket.join(data.room);
            socket.room = data.room;
            console.log("--------------- socket room is --------------------");
            console.log(socket.room);
           // socket.emit('updatechat', 'SERVER', {'text': 'Hello '+data.username+' :) You have connected to room ' + data.room , 'room': data.room, 'users': userIds});

            // update socket session room title
            socket.broadcast.to(data.room).emit('updatechat', 'SERVER', {'text': data.username + ' has joined the room '+data.room, 'room': data.room, 'users': userIds});
            socket.emit('updaterooms', rooms, data.room, {'users': userIds});
        });

        socket.on('disconnect', function() {
            console.log('on disconnect');
            console.log(socket.username);
            console.log((typeof userIds));
            if (((typeof userIds) === 'object' && (typeof userIds[socket.username]) === 'object') && (socket.username!== null || socket.username!=='undefined')){
                if (Object.keys(userIds[socket.username]).length>0)
                    delete userIds[socket.username];
                socket.emit('userleaved', {'username': socket.username, 'users': userIds, 'status': 'leave'});
                socket.broadcast.emit('userleaved', {'username': socket.username, 'users': userIds});
                socket.leave(socket.room);
            }
        });
    });
};