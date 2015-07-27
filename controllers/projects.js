var async = require('async');
var urlutil = require('url');

var Project = require('../models/project');

// GET /projects/:project_id
// GET /projects/:project_id?link=...
exports.showProjectPage = function(req, res) {
  console.log('Show project page: ' + req.params.project_id);

  Project.findById(req.params.project_id, function(err, project) {
    if (err) return res.json({ error: err });
    if (!project) {
      console.log("Invalid project: " + req.params.project_id);
      return res.json({
        error: {
          type: 'NonExistentProject',
          message: "The specified project does not exist"
        }
      });
    }
    res.render('scraper-project.ejs', {
      user: req.user,
      project: project,
      link: req.query.link
    });
  });
}

// GET /projects/:project_id/info
exports.getProjectInfo = function(req, res) {
  console.log('Get project info: ' + req.params.project_id);

  Project.findById(req.params.project_id, function(err, project) {
    if (err) return res.json({ error: err });
    if (!project) {
      console.log("Invalid project: " + req.params.project_id);
      return res.json({
        error: {
          type: 'NonExistentProject',
          message: "The specified project does not exist"
        }
      });
    }
    res.json({
      project_id: project._id,
      name: project.name,
      description: project.description,
      url_matches: project.url_matches,
      script: project.script,
      template: project.template,
      style: project.style,
      last_update: project.last_update,
      created_at: project.created_at
    });
  });
}

exports.getProjectById = function(project_id, callback) {
  console.log('Get project by ID: ' + project_id);

  Project.findById(project_id, function(err, project) {
    if (err) return callback(err);
    if (!project) {
      console.log("Invalid project: " + project_id);
      return callback(new Error("The specified project does not exist"));
    }
    callback(null, project);
  });
}

// GET /projects/list
exports.getProjects = function(req, res) {
  console.log('Get projects');
  if (typeof req.user == 'undefined') {
    // Public projects
    Project.find({}, function(err, projects) {
      if (err) return res.json({error: err});
      // Sort projects by created time
      projects.sort(function(a, b){
        var dateA = new Date(a.created_at),
        dateB = new Date(b.created_at);
        return dateB-dateA;
      });
      res.json({projects: projects});
    });
  } else {
    // Private projects
    Project.find({ owner: req.user._id.toString() }, function(err, projects) {
      if (err) return res.json({error: err});
      // Sort projects by created time
      projects.sort(function(a, b){
        var dateA = new Date(a.created_at),
        dateB = new Date(b.created_at);
        return dateB-dateA;
      });
      res.json({projects: projects});
    });
  }
}

// POST /projects/add
// + req.body.name: String
// + req.body.description: String
// + req.body.url_matches: [String]
// + req.body.script: String
// + req.body.template: String
// + req.body.style: String
exports.addProject = function(req, res) {
  console.log('Add project');
  var project_info = {
    name: req.body.name,
    description: (req.body.description || ''),
    url_matches: (req.body.url_matches || []),
    script: (req.body.script || ''),
    template: (req.body.template || ''),
    style: (req.body.style || '')
  }
  exports.addProjectInternal(req.user, project_info, function(err, result) {
    if (err) return res.json({ error: err });
    return res.json({
      message: "New project has been added",
      project_id: result.project_id,
      created_at: result.created_at
    });
  });
}

// project_info:
// {
//   name: String,
//   description: String,
//   url_matches: [String],
//   script: String,
//   template: String,
//   style: String
// }
exports.addProjectInternal = function(user, project_info, callback) {
  var newProject = new Project();

  newProject.owner = (user) ? user._id : 'public';
  newProject.created_at = new Date();
  newProject.last_update = newProject.created_at;

  newProject.name = project_info.name;
  newProject.description = project_info.description;

  newProject.url_matches = project_info.url_matches;
  newProject.script = project_info.script;
  newProject.template = project_info.template;
  newProject.style = project_info.style;

  console.log(newProject);

  newProject.save(function(err) {
    if (err) return callback(err);
    return callback(null, {
      project_id: newProject._id,
      created_at: newProject.created_at
    });
  });
}

// POST /projects/update
// + req.body.project_id: String
// + req.body.name: String (optional)
// + req.body.description: String (optional)
// + req.body.url_matches: [String] (optional)
// + req.body.script: String (optional)
// + req.body.template: String (optional)
// + req.body.style: String (optional)
exports.updateProject = function(req, res) {
  console.log('Update project ' + req.body.project_id);
  console.log(req.body);

  Project.findById(req.body.project_id, function(err, project) {
    if (err) return res.json({ error: err });
    if (!project) {
      console.log("Invalid project: " + req.params.project_id);
      return res.json({
        error: {
          type: 'NonExistentProject',
          message: "The specified project does not exist"
        }
      });
    }
    var update_data = {
      last_update: new Date()
    };
    
    if (req.body.name) update_data.name = req.body.name;
    if (req.body.description) update_data.description = req.body.description;
    if (req.body.url_matches) update_data.url_matches = req.body.url_matches;
    if (req.body.script) update_data.script = req.body.script;
    if (req.body.template) update_data.template = req.body.template;
    if (req.body.style) update_data.style = req.body.style;

    Project.update({ _id: project._id }, {
      $set: update_data,
    }, function(err) {
      if (err) return res.json({ error: err });
      res.json({
        message: 'The specified project has been updated',
        project_id: req.body.project_id
      });
    });
  });
}

// POST /projects/delete
// + req.body.project_id: String
exports.deleteProject = function(req, res) {
  console.log('Delete project ' + req.body.project_id);

  Project.findById(req.body.project_id, function(err, project) {
    if (err) return res.json({ error: err });
    if (!project) {
      console.log("Invalid project: " + req.params.project_id);
      return res.json({
        error: {
          type: 'NonExistentProject',
          message: "The specified project does not exist"
        }
      });
    }
    Project.remove({ _id: req.body.project_id }, function(err) {
      if (err) return res.json({ error: err });
      return res.json({
        message: "The project has been deleted",
        project_id: req.body.project_id
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

exports.matchProjectInternal = function(url, callback) {
  console.log('Match project: url=' + url);
  var hostname = getLinkHostname(url);
  Project.find({ url_matches: hostname }, function(err, projects) {
    if (err) return callback(err);
    callback(null, projects);
  });
}
