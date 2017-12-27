var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var assert =  require('assert');
var Schema = mongoose.Schema;
const db = mongoose.connect('mongodb://localhost/proyecto2', { useMongoClient: true });

function toLower(v) {
  return v.toLowerCase();
}

var valueSchema = new Schema({ 
 key: { type: String, require:true, set: toLower, unique: true },
 value: { type: String, require:true, set: toLower }
});

Value = mongoose.model('Value', valueSchema);

module.exports.getValue = function(key){
	var promise = Value.findOne({key: key}, {_id:0, __v:0})
		.then(function(data){
			db.close();
			return data;
		})
		.catch(function(err){
			console.log(err);
		});
	return promise;
};

module.exports.setValue = function(key, val){
	var promise = Value.update({key: key}, {value: val.toString()}, {upsert:true})
		.then(function(data){
			db.close();
			return data;
		})
		.catch(function(err){
			console.log(err);
		});
	return promise;
};

module.exports.deleteValue = function(key){
	var promise = Value.findOneAndRemove({key: key})
		.then(function(data){
			db.close();
			return data;
		})
		.catch(function(err){
			console.log(err);
		});
	return promise;
};