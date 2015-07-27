// models/job.js
var mongoose = require('mongoose');

var jobSchema = mongoose.Schema({
  owner: String, // user's ID or 'public'

  url_matches: [String],

  script: String,
  template: String,
  style: String,

  last_update: Date,
  added_at: Date
})

module.exports = mongoose.model('job', jobSchema);
