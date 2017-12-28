var express = require('express');
var app = express();
var server = require('http').createServer(app);

var ip = require('ip');
var port = 8000;

var nodos = [];
//-------------------------------------

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

Value = require('./models/value.js');
//----------------------------------------------

var Eureca = require('eureca.io');

//------------------------------------------
var fs = require('fs');
var readline = require('readline');

//------------------------------------------
mongoose.connect('mongodb://localhost/proyecto2-bd1', { useMongoClient: true }, function(err){
	if(err) 
		console.log("ERROR: conectando a la base de datos. "+err);
	else{
		console.log("Conectado a la BD.");

		server.listen(port ,function(err){
		    if(err){
		        return console.log('Hubo un error al conectar'), process.exit(1);
		    }
		   	console.log("Servidor conectado mediante el puerto",port,"ip", ip.address());
			
		   	/*
			*
			* Servidor Eureca
		   	*
		   	*/
			var eurecaServer = new Eureca.Server();
			eurecaServer.attach(server);

			//Maneja las conecciones de los clientes
			var connections = {};

			eurecaServer.onConnect(function (connection) {
			   console.log('Nuevo cliente ', connection.id, connection.eureca.remoteAddress);
			   connections[connection.id] = eurecaServer.getClient(connection.id);
			});

			eurecaServer.onDisconnect(function (connection) {    
			    console.log('Cliente desconectado', connection.id);
			    delete connections[connection.id];
			});

			//Funciones que estaran visibles en el lado del cliente
			var operacionesServer = eurecaServer.exports.operacionesServer = {};

			operacionesServer.getAll = function () {
				var context = this;
				context.async = true;

				var promise = Value.find({}, {_id:0, __v:0})
					.then(function(data){
						console.log(data);
						context.return(data);
					})
					.catch(function(err){
						console.log(err);
					});
			}

			operacionesServer.get = function (id, key) {
				var context = this;
				context.async = true;

				Value.findOne({key: key}, {_id:0, __v:0})
					.then(function(data){
						if(data == null && id!="local"){
							if(nodos.length == 0){ 
								context.return(null);
							}else{
								for(var i=0; i<nodos.length; i++){
									if(nodos[i].cliente.isReady()){
										nodos[i].funciones.operacionesServer.get("local", key).onReady(function(result){
											if(result != null){
												operacionesServer.set("local", result.key, result.value);
											}
											console.log(result);
											context.return(result);
										});
									}
								}
							}
						}else{
							console.log(data);
							context.return(data);
						}
					})
					.catch(function(err){
						console.log(err);
					});
			}

			operacionesServer.set = function (id, key, value) {
				var context = this;
				context.async = true;

				Value.update({key: key}, {value: value}, {upsert:true})
					.then(function(data){
						console.log(data);
						if(id != "local"){
							nodos.forEach(function(item, index){
								item.funciones.operacionesServer.set("local", key, value);
							});
							context.return(data);
						}
					})
					.catch(function(err){
						console.log(err);
					});
			}

			operacionesServer.del = function (id, key) {
				var context = this;
				context.async = true;

				Value.findOneAndRemove({key: key})
					.then(function(data){
						console.log(data);
						if(id != "local"){
							nodos.forEach(function(item, index){
								item.funciones.operacionesServer.del("local", key);
							});
							context.return(data);
						}
					})
					.catch(function(err){
						console.log(err);
					});
			}
			//------------------------------------------------

			/*
			*
			* Conectar a otros nodos
		   	*
		   	*/
		   	var lineReader = readline.createInterface({
				input: fs.createReadStream('./config.txt')
			});

			lineReader.on('line', function(line){
				console.log(line);

				//Agregar clientes
				var cliente = new Eureca.Client({ uri: 'http://'+line+'/' });
				cliente.ready(function (serverProxy) {
					nodos.push({cliente: cliente, funciones: serverProxy});
					console.log("Conectado al servidor", line);

					serverProxy.operacionesServer.getAll().onReady(function(result){
						if(result != null){
							result.forEach(function(item, index){
								operacionesServer.set("local", item.key, item.value);
							});
						}
					});
				});
			});
			//-------------------------------------------------
				
		});
	}
});