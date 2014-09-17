var loopback = require('loopback');
var boot = require('loopback-boot');
var http = require('http');
var RSVP = require('rsvp');
var fs = require('fs');
// var q = require('q');
// var ss = require('./ScriptureService');
var dbpHelper = require('./dbphelper')();

var app = module.exports = loopback();
var models = app.models();
var config;


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
    var scriptureRequest = {
		id : req.params.id,
		day : (!req.query.d ? null : req.query.d),
		language : (!req.query.l ? null : req.query.l.toUpperCase()),
		html: (req.query.html === 'true' ? true : false)
	};
	
    // Models
    var dayImageModel = app.models.day_image;
    var languageModel = app.models.supported_dbp_language;
    var verseModel = app.models.supported_dbp_verse;
	
	// TODO: Include this when supporting language version associations.
    //var versionModel = app.models.supported_dbp_version;

	// TODO: Expand this, and the url parameters to take in bible versions when that is implemented.
	function getLanguageWithVersion(language) {	
		var languageWithVersionPromise = new RSVP.Promise(function(resolve, reject) {	
			try {
				languageModel.findOne({
					where: {
						language_code: language
					}
				}, function (err, languageCode) {						
					if (err || !languageCode) {
						if (err) {
							reject({error: err});
						} else {
							var message = "Could not find language code '" + language + "'";
							reject({error: message});
						}
					} else {
						resolve({language : languageCode.language_code, version : languageCode.default_version_code});
					}
				});
			} catch (err) {
				reject({error: err.message});
			}
		});
		
		return languageWithVersionPromise;
	}
	
    function getDayImage(dayNumber) {
        var dayImagePromise = new RSVP.Promise(function(resolve, reject) {
			try {
				var dayImagePath = config.defaultBackground;
				
				dayImageModel.findOne({
					where: {
						day: dayNumber
					}
				}, function(err, dayImage) {
					if (err || !dayImage) {
						console.log(err ? ("Error: " + err) : ("Could not find image for day number '" + dayNumber + "'."));
						console.log("Using default image.");
					} else {
						dayImagePath = dayImage.image_source;
					}
					
					resolve(dayImagePath);
				});
			} catch (err) {
				reject({error: err.message});
			}
        });

        return dayImagePromise;
    }
	
	function sendHtml(responseObject)
	{
		fs.readFile(config.pageTemplate, function (err,data) {
		  var page = data.toString();
		  if (err) {
			return console.log(err);
		  }
		  res.send(page.replace("[SCRIPTURE]", responseObject.scripture).replace("[REFERENCE]", responseObject.reference).replace("[IMAGE]",responseObject.image));
		});
	}
	
	function sendError(err)
	{
		res.send(err);
	}

    // First get the verse id;
    verseModel.findOne({
        where: {
            id: scriptureRequest.id
        }
    }, function(err, verse) {
        if (err) {
            sendError({error: "could not find verse"});
        } else if (verse) {
			var languagePromise = getLanguageWithVersion(scriptureRequest.language);
			
			languagePromise.then(function(languageCode) {
				var scripturePromise = dbpHelper.GetScripture(verse, languageCode.language, languageCode.version);
				
				scripturePromise.then(function(response) {
				
					var combinedVerses = dbpHelper.CombineVerses(response.verses);
					var verseReference = dbpHelper.GetVerseReferenceString(verse.book_id, verse.chapter_id, verse.verse_start, verse.verse_end);
					var imagePromise = getDayImage(scriptureRequest.day);

					imagePromise.then(function(dayImage) {
						var finalResponse = {
							scripture: combinedVerses,
							reference: verseReference,
							image: dayImage,
							dbp: {
								fullLink: response.dbtUrl
							}
						};
						
						if (scriptureRequest.html) {
							sendHtml(finalResponse);
						} else {
							res.send(finalResponse);
						}
					});
				}, sendError);
			}, sendError);
        } else {
            sendError({error: "no instance found"});
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
		config = app.get('scriptureServiceConfiguration');
		dbpHelper.dbpApiKey = config.dbpApiKey;

        app.emit('started');
        console.log('Web server listening at: %s', app.get('url'));
    });
};

// start the server if `$ node server.js`
if (require.main === module) {
    app.start();
}