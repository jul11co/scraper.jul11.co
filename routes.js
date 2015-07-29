
var Scraper = require('./controllers/scraper');
var Projects = require('./controllers/projects');

module.exports = function(app) {

  // app.get('/', function(req, res) {
  //   return res.render('scraper-main.ejs', {
  //     user: req.user
  //   });
  // });

  app.get('/', Scraper.showScraperPage);

  // SCRAPER

  app.get('/scrape', Scraper.scrape);
  app.post('/scrape/test', Scraper.scrapeTest);

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
