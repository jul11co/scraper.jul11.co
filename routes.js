
var Scraper = require('./controllers/scraper');
var Jobs = require('./controllers/jobs');
var Projects = require('./controllers/projects');

module.exports = function(app) {

  // app.get('/', function(req, res) {
  //   return res.render('scraper-main.ejs', {
  //     user: req.user
  //   });
  // });

  app.get('/', Scraper.showScraperPage);

  // SCRAPER

  app.get('/scraper', Scraper.showScraperPage);
  app.get('/scraper2', Scraper.showScraper2Page);
  app.get('/scrape', Scraper.scrape);
  app.post('/scrape/test', Scraper.scrapeTest);

  // JOBS

  app.get('/jobs', Jobs.getJobs);
  app.post('/jobs/add', Jobs.addJob);
  app.post('/jobs/update', Jobs.updateJob);
  app.get('/jobs/:job_id', Jobs.getJobInfo);
  app.get('/jobs/:job_id/info', Jobs.getJobInfo);

  // PROJECTS

  app.get('/projects/list', Projects.getProjects);
  app.post('/projects/add', Projects.addProject);
  app.post('/projects/update', Projects.updateProject);
  app.post('/projects/delete', Projects.deleteProject);
  app.get('/projects/:project_id', Projects.showProjectPage);
  app.get('/projects/:project_id/info', Projects.getProjectInfo);

  // PLAYGROUND

  app.get('/playground', function(req, res) {
    return res.render('scraper-playground.ejs', {
      user: req.user
    });
  });
};
