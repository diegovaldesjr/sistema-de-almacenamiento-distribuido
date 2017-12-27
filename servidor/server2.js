var express = require('express');
var app = express();
var server = require('http').createServer(app);

var ip = require('ip');
var port = 3000;

var fs = require('fs');
var ipSiguiente;
var cliente; 
var serverSiguente = null;

//-------------------------------------
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

Value = require('./models/value.js');
//----------------------------------------------

var Eureca = require('eureca.io');
var eurecaServer = new Eureca.Server();
eurecaServer.attach(server);

function compactar(d1, d2){
	var data = [];
	var igual = false;

	if(d1 != null){
		d1.forEach(function(itemD1, indexD1){
			d2.forEach(function(itemD2, indexD2){
				if(itemD1.key == itemD2.key)
					igual = true;
			});
			if(!igual)
				data.push(itemD1);
		});
	}
	d2.forEach(function(item, index){
		data.push(item);
	});

	return data;
}

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
eurecaServer.exports.sincronizar = function(nodeIp, nodeIpNext) {
	var context = this;
	context.async = true;

	if(nodeIp == ip.address()+":"+port){ context.return(null)}
	else if(ipSiguiente == nodeIpNext){
		ipSiguiente = nodeIp;
		//Cambio el cliente
		cliente.disconnect();
		cliente = new Eureca.Client({ uri: 'http://'+ipSiguiente+'/' });
	   	cliente.ready(function (serverProxy) {
			serverSiguente = serverProxy;
			console.log("Actualizado servidor siguiente:", ipSiguiente);
		});

		operacionesServer.getAll(false)
			.then(function(data){
				//console.log(data);
				context.return(data);
			});
	}else{
		operacionesServer.getAll(false)
			.then(function(data){
				//console.log(data);
				serverSiguente.sincronizar(nodeIp, nodeIpNext).onReady(function(result){
					var dCompacta = compactar(result, data);
					context.return(dCompacta);
				});
			});
	}
}

var operacionesServer = eurecaServer.exports.operacionesServer = {};

operacionesServer.getAll = function (cliente) {
	var context = this;
	context.async = true;

	var promise = Value.find({}, {_id:0, __v:0})
		.then(function(data){
			console.log(data);
			if(cliente)
				context.return(data);
			else
				return data;
		})
		.catch(function(err){
			console.log(err);
		});

	if(!cliente)
		return promise;
}

operacionesServer.get = function (id, next, key) {
	if(id == next){return null;}
	
	var context = this;
	context.async = true;

	Value.findOne({key: key}, {_id:0, __v:0})
		.then(function(data){
			if(data == null){
				if(serverSiguente == null){return context.return(null);}
				serverSiguente.operacionesServer.get(id, ipSiguiente, key).onReady(function(result){
					if(result != null){
						operacionesServer.set("local", null, result.key, result.value);
					}
					console.log(result);
					context.return(result);
				});
			}else{
				console.log(data);
				context.return(data);
			}
		})
		.catch(function(err){
			console.log(err);
		});
}

operacionesServer.set = function (id, next, key, value) {
	if(id == next){return;}

	var context = this;
	context.async = true;

	Value.update({key: key}, {value: value}, {upsert:true})
		.then(function(data){
			console.log(data);
			if(id != "local"){
				serverSiguente.operacionesServer.set(id, ipSiguiente, key, value);
				context.return(data);
			}
		})
		.catch(function(err){
			console.log(err);
		});
}

operacionesServer.del = function (id, next, key) {
	if(id == next){return;}

	var context = this;
	context.async = true;

	Value.findOneAndRemove({key: key})
		.then(function(data){
			console.log(data);
			serverSiguente.operacionesServer.del(id, ipSiguiente, key);
			context.return(data);
		})
		.catch(function(err){
			console.log(err);
		});
}
//------------------------------------------
 
mongoose.connect('mongodb://localhost/proyecto2-bd2', { useMongoClient: true }, function(err){
	if(err) 
		console.log("ERROR: conectando a la base de datos. "+err);
	else{
		console.log("Conectado a la BD.");
		fs.readFile("./config2.txt", "utf8", function(err, data){
			if(err) throw err;
			ipSiguiente = data;
		
			server.listen(port ,function(err){
			    if(err){
			        return console.log('Hubo un error al conectar'), process.exit(1);
			    }
			   	console.log("Servidor conectado mediante el puerto 3000 ip", ip.address());
			   	console.log("Ip servidor siguiente:", ipSiguiente);

			   	cliente = new Eureca.Client({ uri: 'http://'+ipSiguiente+'/' });
			   	cliente.ready(function (serverProxy) {
					serverSiguente = serverProxy;
					console.log("Conectado al servidor siguiente", ipSiguiente);
					setTimeout(function(){ 
						serverSiguente.sincronizar(ip.address()+":"+port, ipSiguiente).onReady(function(result){
							console.log("Datos",result);

							if(result != null){
								result.forEach(function(item, index){
									operacionesServer.set("local", null, item.key, item.value);
								});
							}
						});
					}, 3000);
				});

			   	return;
			});
		});
	}
});