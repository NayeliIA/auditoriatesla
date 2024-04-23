/*************************************************** Setup de eventos a escuchar*/
require('events').EventEmitter.defaultMaxListeners = 20;
//**************************************************** HTTPS server setup
//-----* Express inicia servidor / carpeta raiz
const express = require('express');
const app = express();



app.use(express.static(__dirname));

var https = require('https');
const fs = require('fs')
var fss = require('fs');

var key = fss.readFileSync('./encryption/server.key');
var cert = fss.readFileSync('./encryption/server.cert');
var httpsOptions = { key: key, cert: cert };

const server = https.createServer(httpsOptions, app).listen(5000, function (connection) {
    console.log('Server ready...');

});
server.on('data', function (data) { console.log(data.toString()) });



//Socket configuration 
var io = require('socket.io')(server); //Bind socket.io to our express server.
var net = require('net')
var tcpipserver = net.createServer(function (connection) {
    console.log('TCP client connected');

    connection.on('data', function (data) { console.log(data.toString()) });

})
tcpipserver.listen(7777, function () {
    console.log(' Server Port 80 listening...');
});
