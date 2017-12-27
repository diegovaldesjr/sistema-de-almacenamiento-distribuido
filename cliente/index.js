var Eureca = require('eureca.io');
var client = new Eureca.Client({ uri: 'http://localhost:8000/' });
 
client.ready(function (serverProxy) {
    serverProxy.hello();
});