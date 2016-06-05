var express = require('express');
var expressApp = express();
var socketio = require('socket.io');
var https = require('https');
var fs = require('fs');
var uuid = require('node-uuid');

console.log(__dirname);
var connInfo = require('./connectionInfo');
var connectionInfo = connInfo.ConnectionInfo;

var options = {
    key: fs.readFileSync(__dirname + '/../config/ssl/server.key'),
    cert: fs.readFileSync(__dirname + '/../config/ssl/server.crt')
};
expressApp.use(express.static(__dirname + '/../app/'));

/*
 * send data to 
 */

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
    
    var saveData = function(data)
    {
        
    }
    io.on('connection', function (socket) {
        console.log("--------------Socket is connected----------");
        console.log(socket.handshake);
        console.log("--------On connection socket room is----------");
        console.log(socket.room);
        
        
        socket.on('init', function (data) {
            console.log("---------------- On event init data----------");
            console.log(data);
             console.log("---------------- Connection info ----------");
            console.log(connectionInfo);
            connectionInfo.sender = data.username;
            
           
            socket.room = data.room;
            socket.username = data.username;
             
            console.log("--------------------Client data current Room------------------");
            console.log(socket.room);
            console.log("--------------------Client data current user ------------------");
            console.log(data.username);
          
            userIds[data.username] = data;
            
            
            console.log("------------------------Users Ids json object---------------------");
            console.log(userIds);
            console.log("----------------------- Current Room clients----------------------");
            console.log(io.sockets.adapter.rooms[socket.room]);
            
            if (io.sockets.adapter.rooms[socket.room])
                numClients = io.sockets.adapter.rooms[socket.room].length;
            
            
            console.log('-----Room ' + socket.room + ' has ' + numClients + ' client(s)----');
            var result = {'room': socket.room, 'socket': socket.id, 'user': data.username, 'users': userIds, 'status': 'connected'};
            sockets[socket.id] = result;
            
            if (numClients === 0) {
                socket.join(data.room);
                socket.emit('created', result);

            } else if (numClients <= config.max_connections) {
                socket.join(data.room);
                io.sockets.in(data.room).emit('joined', result);
                console.log(socket.adapter.rooms[data.room].length);
                socket.emit('full', result);
            }

            console.log(io.sockets.adapter.rooms[data.room]);
            console.log('Peer connected to room', data.room, 'with #', socket.id);
        });

        socket.on('msg', function (data) {
            console.log("Message received: " + data.type);
            connectionInfo.handleEvents(data.type, data)
            console.log(data);
            io.sockets.in(data.room).emit('msg', data)
        });
        socket.on('test', function(data) {
            io.sockets.in(data.room).emit('test', data)
        });
        
        socket.on('userleave', function (data)
        {
        
        });
        // when the client emits 'sendchat', this listens and executes
        socket.on('message', function (data) {
            console.log("Server: on send chat event starts", data);
            io.sockets.in(data.room).emit('updatechat', {'text': data.text, 'room': data.room, 'users': userIds, 'user': data.username, 'status': 'connected'});
        });

        socket.on('switchRoom', function (data) {
            // leave the current room (stored in session)
            console.log("---------------------leave curent room -----------------");
            console.log(data.room)
            console.log("---------------------user leaved curent room is -----------------");
            console.log(data.username);
            socket.leave(socket.room);
            // sent message to OLD room
            // join new room, received as function parameter
            console.log("----------- join to new room------------------");
            
            socket.join(data.room);
            socket.room = data.room;
            
            console.log("--------------- socket room is --------------------");
            console.log(socket.room);
            
            socket.emit('updatechat',  {'user': 'SERVER', 'text': 'Hello '+data.username+' :) You have connected to room ' + data.room , 'room': data.room, 'users': userIds, 'status': 'connected'});
            socket.broadcast.to(data.room).emit('updatechat', {'user': 'SERVER', 'text': data.username + ' has joined the room '+data.room, 'room': data.room, 'users': userIds, 'status': 'connected'});
            socket.emit('updaterooms', {'rooms': rooms, 'room': data.room, 'users': userIds});
        });

        socket.on('disconnect', function() {
            console.log('-----------------On disconnect-----------------------');
            connectionInfo.connectionClose = new Date();
            result = connectionInfo.getProps(connectionInfo);
            console.log(result);
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
