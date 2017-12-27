#!/usr/bin/env node

var program = require('commander');
var id = "192.168.1.133:8000";

var Eureca = require('eureca.io');
var client = new Eureca.Client({ uri: 'http://'+id+'/' });

program
	.version('0.0.1')
	.description('Base de datos distribuida clave-valor');

program
	.command('all')
	.alias('a')
	.description('Permite obtener todos los valores y sus claves.')
	.action(function(){
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.getAll(true).onReady(function(result){
				if(result == null){
			    	console.log("Error valor", result);
			    }else{
			    	console.log(result);
			    }
			    process.exit();
			});
		});
	});

program
	.command('get <key>')
	.alias('g')
	.description('Permite obtener el valor asociado a una clave previamente creada.')
	.action(function(key){
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.get(id, null, key).onReady(function(result){
				if(result == null){
			    	console.log("Error valor", result);
			    }else{
			    	console.log(result);
			    }
			    process.exit();
			});
		});
	});

program
	.command('set <key> <value>')
	.alias('s')
	.description('Permite crear o cambiar el valor asociado a una clave.')
	.action(function(key, value) {
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.set(id, null, key, value).onReady(function(result){
				if(result == null){
			    	console.log("Error al actualizar.", result);
			    }else{
			    	console.log(result);
			    	console.info('Valor actualizado');
			    }
			    process.exit();
			});
		});
	});

program
	.command('del <key>')
	.alias('d')
	.description('Permite eliminar un par clave-valor de la base de datos.')
	.action(function(key) {
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.del(id, null, key).onReady(function(result){
				if(result == null){
			    	console.log("Error al eliminar. Valor:", result);
			    }else{
			    	console.log(result);
			    	console.info('Valor eliminado.');
			    }
			    process.exit();
			});
		});
	});

program.parse(process.argv);