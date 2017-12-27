var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function toLower(v) {
  return v.toLowerCase();
}

var valueSchema = new Schema({ 
 key: { type: Number, require:true, set: toLower, unique: true },
 value: { type: String, require:true, set: toLower }
});

module.exports = mongoose.model('Value', valueSchema);