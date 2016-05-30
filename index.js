console.log(__dirname);
var config = require(__dirname+'/config/config.json');
var server = require(__dirname+'/server/server');

// In case the port is set using an environment variable (Heroku)
console.log(config);
server.run(config);