#!/usr/bin/env node

var program = require('commander');
var Eureca = require('eureca.io');

program
	.version('0.0.1')
	.description('Base de datos distribuida clave-valor');

program
	.command('all <id>')
	.alias('a')
	.description('Permite obtener todos los valores y sus claves.')
	.action(function(id){
		var client = new Eureca.Client({ uri: 'http://'+id+'/' });
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.getAll().onReady(function(result){
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
	.command('get <key> <id>')
	.alias('g')
	.description('Permite obtener el valor asociado a una clave previamente creada.')
	.action(function(key, id){
		var client = new Eureca.Client({ uri: 'http://'+id+'/' });
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.get("cliente", key).onReady(function(result){
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
	.command('set <key> <value> <id>')
	.alias('s')
	.description('Permite crear o cambiar el valor asociado a una clave.')
	.action(function(key, value, id) {
		var client = new Eureca.Client({ uri: 'http://'+id+'/' });
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.set("cliente", key, value).onReady(function(result){
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
	.command('del <key> <id>')
	.alias('d')
	.description('Permite eliminar un par clave-valor de la base de datos.')
	.action(function(key, id) {
		var client = new Eureca.Client({ uri: 'http://'+id+'/' });
		client.ready(function (serverProxy) {
			serverProxy.operacionesServer.del("cliente", key).onReady(function(result){
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