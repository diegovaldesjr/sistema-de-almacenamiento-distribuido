#!/usr/bin/env node

var program = require('commander');
var {setValue, getValue, deleteValue} = require('./models/index.js');


program
	.version('0.0.1')
	.description('Base de datos distribuida clave-valor');

program
	.command('get <key>')
	.alias('g')
	.description('Permite obtener el valor asociado a una clave previamente creada.')
	.action(function(key){
		getValue(key).then(function(res){
			console.log(res);
		}, function(err){
			console.log(err)
		});
	});

program
	.command('set <key> <value>')
	.alias('s')
	.description('Permite crear o cambiar el valor asociado a una clave.')
	.action(function(key, value) {
		setValue(key, value).then(function(res){
			console.info('Valor actualizado');
			console.log(res);

		}, function(err){
			console.log(err)
		});
		
	});

program
	.command('del <key>')
	.alias('d')
	.description('Permite eliminar un par clave-valor de la base de datos.')
	.action(function(key) {
		deleteValue(key).then(function(res){
			console.log("Valor eliminado.");
			console.log(res);

		}, function(err){
			console.log(err);
		});
	});

program.parse(process.argv);