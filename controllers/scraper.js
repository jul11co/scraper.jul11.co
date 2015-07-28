var fs = require("fs");
var request = require('request');
var cheerio = require('cheerio');
var urlutil = require('url');
var zlib = require('zlib');
var ejs = require('ejs');

var configPath = require("../config/path");

var Jobs = require('./jobs');
var Projects = require('./projects');

// GET /scraper?link=...
exports.showScraperPage = function(req, res) {
  console.log('Show scraper page');
  if (typeof req.query.link == 'undefined') {
    // return res.render('scraper-view.ejs', {
    //   user: req.user,
    //   page: {},
    //   job: {},
    //   urlutil: urlutil
    // });
    return res.render('scraper-main.ejs', {
      user: req.user
    });
  }
  scrapeInternal({ 
    url: req.query.link,
    override_url: '/scraper?link='
  }, function(err, result) {
    if(err){
      console.log(err);
      return res.render('scraper-view.ejs', {
        user: req.user,
        page: { url: req.query.link },
        job: {},
        urlutil: urlutil
      });
    }
    return res.render('scraper-view.ejs', {
      user: req.user,
      page: result.page,
      job: result.job,
      urlutil: urlutil
    });
  });
}

function requestWithEncoding(options, callback) {
  var req = request.get(options);

  req.on('response', function(res) {
    var chunks = [];
    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      var buffer = Buffer.concat(chunks);
      var encoding = res.headers['content-encoding'];
      if (encoding == 'gzip') {
        zlib.gunzip(buffer, function(err, decoded) {
          callback(err, res, decoded && decoded.toString());
        });
      } else if (encoding == 'deflate') {
        zlib.inflate(buffer, function(err, decoded) {
          callback(err, res, decoded && decoded.toString());
        })
      } else {
        callback(null, res, buffer.toString());
      }
    });
  });

  req.on('error', function(err) {
    callback(err);
  });
}

function readScriptFileSync(script_file) {
  return fs.readFileSync(configPath.rootPath + '/views/websites/' + script_file, 'utf-8');
}

// options: 
// {
//   url: String,
//   no_default: String, ('yes' or 'no')
//   override_url: String ('http://.../scraper?link=')
// }
function scrapeInternal(options, callback) {
  console.log('Scrape: options.url=' + options.url);
  requestWithEncoding(
    {
      url: options.url,
      headers: {
        'User-Agent': 'request'
      },
      timeout: 20000 /* 20 seconds */
    },
    function(error, response, html){
      if(error){
        console.log(error);
        return callback(error);
      }
      
      var page = {
        url: '',
        title: '',
        description: '',
        image: '',
        html: '',
        css: '',
        links: []
      };
      var job = {
        id: '',
        url_matches: [],
        script: '',
        template: '',
        style: ''
      };

      page.url = response.request.href;
      console.log("URL: " + page.url);

      var content_type = response.headers['content-type'];
      if (content_type && content_type.indexOf('html') == -1) {
        console.log(response.headers);
        return callback(new Error('Not HTML page (' + content_type + ')'));
      }

      console.log(response.headers);
      console.log("HTML length: " + html.length);

      var $ = cheerio.load(html);

      page.title = $('title').first().text();
      page.description = $('meta[name*=description]').attr('content');
      if (page.title) {
        page.title = page.title.replace(/(\r\n|\n|\r)/gm, '');
      }
      if (page.description) {
        page.description = page.description.replace(/(\r\n|\n|\r)/gm, '');
      }

      // Open Graph meta tags
      var og_metadata = {
        url: $('meta[property="og:url"]').attr('content'),
        type: $('meta[property="og:type"]').attr('content'),
        title: $('meta[property="og:title"]').attr('content'),
        description: $('meta[property="og:description"]').attr('content'),
        image: $('meta[property="og:image"]').attr('content')
      };
      if (og_metadata.image) {
        page.image = og_metadata.image;
      }
      if (page.description == '' && og_metadata.description && og_metadata.description != '') {
        page.description = og_metadata.description.replace(/(\r\n|\n|\r)/gm, '');
      }

      console.log('Page title: ' + page.title);
      console.log('Page description: ' + page.description);
  
      Jobs.matchJobInternal(page.url, function(err, jobs) {
        if (err) {
          console.log(err);
          return callback(new Error('Find matching job failed'));
        }

        var baseTemplateFile = configPath.rootPath + "/views/scraper-base.ejs";

        fs.readFile(baseTemplateFile, 'utf8', function (err, template) {
          if (err) {
            console.log(err);
            return callback(new Error('Reading template file failed'));
          }

          if (jobs && jobs.length > 0) {
            console.log('Matched jobs: ' + jobs.length);

            job.id = jobs[0]._id;
            job.url_matches = jobs[0].url_matches;
            job.script = jobs[0].script;
            job.template = jobs[0].template;
            job.style = jobs[0].style;

            page.css = job.style;

            // console.log('Matched Job [0]: ');
            // console.log(job);

            // append job script & template to template
            if (job.script != '') job.script = job.script.replace(/(<%|%>)/gm, '');
            template += '<%' + job.script + '%>';
            if (job.template == '') {
              job.template = '<%-page.html%>';
            }
            template += job.template;
          } else {
            if (!options.no_default || options.no_default !== 'yes') {
              template += '<%postProcess();%>';
            }
            template += '<%-page.html%>';
          }

          // console.log('Template:');
          // console.log(template);

          var resultHtml = '';
          try {
            resultHtml = ejs.render(template, {
              page: page,
              job: job,
              $: $,
              cheerio: cheerio,
              urlutil: urlutil,
              readScriptFileSync: readScriptFileSync,
              override_url: options.override_url
            });
          } catch (e) {
            console.log(e);
            return callback(e);
          }

          // console.log('Result (HTML):');
          // console.log(resultHtml);

          if (page.html == '') {
            page.html = resultHtml;
          }

          return callback(null, {
            request_url: options.url,
            page: page,
            job: job
          });
        });
      });
    }
  );
}

// GET /scraper2?link=...
exports.showScraper2Page = function(req, res) {
  console.log('Show scraper2 page');
  if (typeof req.query.link == 'undefined') {
    return res.render('scraper-view2.ejs', {
      user: req.user,
      link_url: '',
      link_html: '',
      cheerio: cheerio,
      urlutil: urlutil,
      readScriptFileSync: readScriptFileSync
    });
  }
  requestWithEncoding(
    {
      url: req.query.link,
      headers: {
        'User-Agent': 'request'
      },
      timeout: 20000 /* 20 seconds */
    },
    function(error, response, html){
      if(error){
        console.log(error);
        return res.render('scraper-view2.ejs', {
          user: req.user,
          link_url: req.query.link,
          link_html: null,
          cheerio: cheerio,
          urlutil: urlutil,
          rootPath: configPath.rootPath
        });
      }
      
      var link_url = response.request.href;
      console.log("URL: " + link_url);

      var content_type = response.headers['content-type'];
      if (content_type && content_type.indexOf('html') == -1) {
        console.log(response.headers);
        console.log('Not HTML page (' + content_type + ')'); 
        return res.render('scraper-view2.ejs', {
          user: req.user,
          link_url: link_url,
          link_html: '',
          cheerio: cheerio,
          urlutil: urlutil,
          rootPath: configPath.rootPath
        });
      }

      console.log(response.headers);
      console.log("HTML length: " + html.length);

      return res.render('scraper-view2.ejs', {
        user: req.user,
        link_url: link_url,
        link_html: html,
        cheerio: cheerio,
        urlutil: urlutil,
        rootPath: configPath.rootPath
      });
    }
  );
}

// Scrape a link for information
// GET /scrape?link=...
// GET /scrape?project=...&link=...
// optional:
//  + no_default=... ('yes' or 'no')
//  + override_url=... (example: 'http://scraper.jul11.co/scraper?link=')
exports.scrape = function(req, res) {
  if (!req.query.link || req.query.link == "") {
    return res.json({
      error: {
        type: "MissingArgumentError",
        message: "Missing arguments (link)"
      }
    });
  }
  var scrape_options = {
    url: req.query.link,
    no_default: req.query.no_default,
    override_url: req.query.override_url
  };
  if (req.query.project && req.query.project != '') {
    Projects.getProjectById(req.query.project, function(err, project) {
      if (err) return callback(err);    
      return runScrapeProject(project, scrape_options, function(err, result) {
        if (err) return res.json({ error: err.message });
        res.json(result);
      });
    });
  } else {
    return scrapeInternal(scrape_options, function(err, result) {
      if (err) return res.json({ error: err });
      res.json(result);
    });
  }
}

// options: 
// {
//   url: String,
//   no_default: String, ('yes' or 'no')
//   override_url: String ('http://.../scraper?link=')
// }
function runScrapeProject(project, options, callback) {
  console.log('Scrape: project_id=' + project.id + ', url=' + options.url);
  requestWithEncoding(
    {
      url: options.url,
      headers: {
        'User-Agent': 'request'
      },
      timeout: 20000 /* 20 seconds */
    },
    function(error, response, html){
      if(error){
        console.log(error);
        return callback(error);
      }
      
      var page = {
        url: '',
        title: '',
        description: '',
        image: '',
        html: '',
        css: '',
        links: []
      };

      page.url = response.request.href;
      console.log("URL: " + page.url);

      var content_type = response.headers['content-type'];
      if (content_type && content_type.indexOf('html') == -1) {
        console.log(response.headers);
        return callback(new Error('Not HTML page (' + content_type + ')'));
      }

      console.log(response.headers);
      console.log("HTML length: " + html.length);

      var $ = cheerio.load(html);

      page.title = $('title').first().text();
      page.description = $('meta[name*=description]').attr('content');
      if (page.title) {
        page.title = page.title.replace(/(\r\n|\n|\r)/gm, '');
      }
      if (page.description) {
        page.description = page.description.replace(/(\r\n|\n|\r)/gm, '');
      }

      // Open Graph meta tags
      var og_metadata = {
        url: $('meta[property="og:url"]').attr('content'),
        type: $('meta[property="og:type"]').attr('content'),
        title: $('meta[property="og:title"]').attr('content'),
        description: $('meta[property="og:description"]').attr('content'),
        image: $('meta[property="og:image"]').attr('content')
      };
      if (og_metadata.image) {
        page.image = og_metadata.image;
      }
      if (page.description == '' && og_metadata.description && og_metadata.description != '') {
        page.description = og_metadata.description.replace(/(\r\n|\n|\r)/gm, '');
      }

      console.log('Page title: ' + page.title);
      console.log('Page description: ' + page.description);
  
      var baseTemplateFile = configPath.rootPath + "/views/scraper-base.ejs";
      fs.readFile(baseTemplateFile, 'utf8', function (err, template) {
        if (err) {
          console.log(err);
          return callback(new Error('Reading template file failed'));
        }

        page.css = project.style;

        // append project script & template to template
        if (project.script != '') project.script = project.script.replace(/(<%|%>)/gm, '');
        template += '<%' + project.script + '%>';
        if (project.template == '') {
          project.template = '<%-page.html%>';
        }
        template += project.template;

        var resultHtml = '';
        try {
          resultHtml = ejs.render(template, {
            page: page,
            project: project,
            $: $,
            cheerio: cheerio,
            urlutil: urlutil,
            override_url: options.override_url
          });
        } catch (e) {
          console.log(e);
          return callback(e);
        }

        // console.log('Result (HTML):');
        // console.log(resultHtml);

        if (page.html == '') {
          page.html = resultHtml;
        }

        return callback(null, {
          request_url: options.url,
          page: page,
          project: project
        });
      });
    }
  );
}

// Scrape a link with specified script, template & style
// POST /scrape/test
// + req.body.link: String
// + req.body.url_matches: [String]
// + req.body.script: String
// + req.body.template: String
// + req.body.style: String
// optional:
//  + req.body.no_default=... ('yes' or 'no')
//  + req.body.override_url=... (example: 'http://scraper.jul11.co/scraper?link=')
exports.scrapeTest = function(req, res) {
  console.log('Scrape test');
  console.log(req.body);
  if (!req.body.link || req.body.link == "") {
    return res.json({ 
      error: "Missing arguments (link)"
    });
  }
  var scrape_options = {
    url: req.body.link,
    no_default: req.body.no_default,
    override_url: req.body.override_url
  };
  var project = {
    _id: 'playground',
    url_matches: req.body.url_matches,
    script: req.body.script,
    template: req.body.template,
    style: req.body.style
  }; 
  return runScrapeProject(project, scrape_options, function(err, result) {
    if (err) return res.json({ error: err.message });
    res.json(result);
  });
}
