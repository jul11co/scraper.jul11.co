var async = require('async');
var urlutil = require('url');

var Job = require('../models/job');

// POST /jobs/add
// + req.body.url_matches: [String]
// + req.body.script: String
// + req.body.template: String
// + req.body.style: String
exports.addJob = function(req, res) {
  console.log('Add job');
  var job_info = {
    url_matches: req.body.url_matches,
    script: req.body.script,
    template: req.body.template,
    style: req.body.style
  }
  exports.addJobInternal(req.user, job_info, function(err, result) {
    if (err) return res.json({ error: err });
    return res.json({
      message: "New job has been added",
      job_id: result.job_id,
      added_at: result.added_at
    });
  });
}

// job_info:
// {
//   url_matches: [String],
//   script: String,
//   template: String,
//   style: String
// }
exports.addJobInternal = function(user, job_info, callback) {
  var newJob = new Job();

  newJob.owner = (user) ? user._id : 'public';
  newJob.added_at = new Date();
  newJob.last_update = newJob.added_at;

  newJob.url_matches = job_info.url_matches;
  newJob.script = job_info.script;
  newJob.template = job_info.template;
  newJob.style = job_info.style;

  console.log(newJob);

  newJob.save(function(err) {
    if (err) return callback(err);
    return callback(null, {
      job_id: newJob._id,
      added_at: newJob.added_at
    });
  });
}

// POST /jobs/update
// + req.body.job_id: String
// + req.body.url_matches: [String] (optional)
// + req.body.script: String (optional)
// + req.body.template: String (optional)
// + req.body.style: String (optional)
exports.updateJob = function(req, res) {
  console.log('Update job ' + req.body.job_id);
  console.log(req.body);

  Job.findById(req.body.job_id, function(err, job) {
    if (err) return res.json({ error: err });
    if (!job) {
      console.log("Invalid job: " + req.params.job_id);
      return res.json({
        error: {
          type: 'NonExistentJob',
          message: "The specified job does not exist"
        }
      });
    }
    var update_data = {};
    if (req.body.url_matches) update_data.url_matches = req.body.url_matches;
    if (req.body.script) update_data.script = req.body.script;
    if (req.body.template) update_data.template = req.body.template;
    if (req.body.style) update_data.style = req.body.style;
    Job.update({ _id: job._id }, {
      $set: update_data,
    }, function(err) {
      if (err) return res.json({ error: err });
      res.json({
        message: 'The specified job has been updated',
        job_id: req.body.job_id
      });
    });
  });
}

function getLinkHostname(url) {
  if (!url) return '';
  var url_obj = urlutil.parse(url);
  var url_hostname = (url_obj) ? url_obj.hostname : '';
  url_hostname = url_hostname.replace(/(www.)/gm, '');
  return url_hostname;
}

exports.matchJobInternal = function(url, callback) {
  console.log('Match job: url=' + url);
  var hostname = getLinkHostname(url);
  Job.find({ url_matches: hostname }, function(err, jobs) {
    if (err) return callback(err);
    callback(null, jobs);
  });
}

exports.getJobs = function(req, res) {
  
}

// GET /jobs/:job_id/info
exports.getJobInfo = function(req, res) {
  Job.findById(req.params.job_id, function(err, job) {
    if (err) return res.json({ error: err });
    if (!job) {
      console.log("Invalid job: " + req.params.job_id);
      return res.json({
        error: {
          type: 'NonExistentJob',
          message: "The specified job does not exist"
        }
      });
    }
    res.json({
      job_id: job._id,
      url_matches: job.url_matches,
      script: job.script,
      template: job.template,
      style: job.style,
      added_at: job.added_at
    });
  });
}