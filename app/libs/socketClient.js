var socket = io.connect(location.protocol + '//' + location.host);

socket.on('msg', function (data) {
    socketService.handleMessage(data);
});
socket.on('updatechat', function (data) {
    console.log("Update chat message", data);
    AppEmitter.emit('updatechat', data);  
});
socket.on('updaterooms', function (data) {
    AppEmitter.emit('updaterooms', data);  
});
socket.on('created', function (data)
{
    console.log('room created');
    console.log(data);
   
});

socket.on('joined', function (data)
{
    updateUsersConnected(data.users, 'conneted')
    console.log('user ' + data.username + ' joined to room ' + data.room);
    console.log(data);

});

socket.on('ready', function (data)
{
    console.log('room joined: ');
    console.log(data);
    AppEmitter.emit('updateusers', data);  
});

socket.on('fill', function (data) {
    console.log('socket fill: ');
    console.log(data.socket);
    AppEmitter.emit('updateusers', data);  
});

socket.on('userleaved', function (data)
{
    console.log('userleaved');
    console.log(data);
    AppEmitter.emit('updateusers', data);  
});

socket.on('connected', function (data) {
    console.log("If Succcesfuly connected update users connected");
    console.log(data);
    AppEmitter.emit('updateusers', data);  
});

socket.send = function(event, fn, data)
{
    socket.on(event,fn(data));
}