var loopback = require('loopback');
var boot = require('loopback-boot');
var http = require('http');
var RSVP = require('rsvp');
// var q = require('q');
// var ss = require('./ScriptureService');
var dbpHelper = require('./dbphelper')("dbpApiKey");

var app = module.exports = loopback();
var models = app.models();


// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);

// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:
//   var path = require('path');
//   app.use(loopback.static(path.resolve(__dirname, '../client')));

var GetMethod = function(req, res) {
	var rid = req.params.id;
	var rday = req.query.d;
	var language = req.query.l;

	console.log("Language: " + language);

	// Models
	var dayImageModel = app.models.day_image;
	var languageModel = app.models.supported_dbp_language;
	var verseModel = app.models.supported_dbp_verse;
	var versionModel = app.models.supported_dbp_version;

  function getDayImage(dayNumber) {
      var dayImage = "baseImage.jpg";
      var result = new RSVP.Promise(function (resolve, reject) {
        dayImageModel.findOne({where: {day : dayNumber}}, function(err, dayImage)
        {
          if (err || !dayNumber)
          {
            console.log("Could not find day image link, using base image", err);
            resolve(dayImage); // resolve to default image instead of error.
          }
          else
          {
            console.log("Image found");
            dayImage = "dbImage.jpg";
            resolve(dayImage);
          }
        });
      });

      return result;
  }

	// First get the verse id;
	verseModel.findOne({where: { id : rid }}, function(err, verse)
	{
		if (err)
		{
			res.send("Error: could not find verse");
		}
		else if (verse)
		{
      var scripture = dbpHelper.getScripture(verse, language);
			scripture.then(function(response) {
        var combinedVerses = dbpHelper.combineVerses(response.verses);
				var verseReference = dbpHelper.getVerseReferenceString(verse.book_id, verse.chapter_id, verse.verse_start, verse.verse_end);
				var imagePromise = getDayImage(rday);
        imagePromise.then(function (dayImage) {
          var finalResponse = {
            scripture : combinedVerses,
            reference: verseReference,
            image : dayImage,
            dbp: {
              fullLink : response.dbtUrl
            }
          };
          res.send(finalResponse);
        });
      });
		}
		else
		{
			res.send("no instance found");
		}
	});
};

app.get('/:id', GetMethod);

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
