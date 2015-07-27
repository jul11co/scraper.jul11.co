// models/project.js
var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({

  owner: String, // user's ID or 'public'

  name: String,
  description: String,

  url_matches: [String],

  script: String,
  template: String,
  style: String,

  revisions: [{
  	rev: Number,
  	project_id: String,
  	created_at: Date 
  }],

  last_update: Date,
  created_at: Date
})

module.exports = mongoose.model('project', projectSchema);
