var express = require('express');
var expressApp = express();
var socketio = require('socket.io');
var https = require('https');
var fs = require('fs');
var uuid = require('node-uuid');

var eventsHndl = require('./eventsHandler');
console.log(__dirname);


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

    server.listen(config.PORT);

    console.log("Server started!");
    console.log('Listening on', config.PORT);
    var io = socketio.listen(server, {log: false});
    io.on('connection', function (socket) {
        var eventsHandler = eventsHndl.eventsHandler(socket, io, config);
    });
};
