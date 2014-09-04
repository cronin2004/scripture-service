var loopback = require('loopback');
var boot = require('loopback-boot');
var http = require('http');
// var q = require('q');
// var ss = require('./ScriptureService');

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
	var dbpApiKey = "";
	
	// First get the verse id;
	verseModel.findOne({where: { id : rid }}, function(err, verse)
	{
		if (err)
		{
			res.send("Error: could not find verse");
		}
		else if (verse)
		{
			var ntBooks = ['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
			
			// this decides which volume to use based on the book requested.
			var getVolume = function (book, language) {
				var versionCode = ntBooks.indexOf(book) > -1 ? 'ESVN2ET' : 'ESVO2ET'
				versionCode = language + versionCode;
				console.log("Version Code: " + versionCode);
				return versionCode;
			};
			
			var getDayImage = function(dayNumber)
			{
				var dayImage = "baseImage.jpg";
				//var findDayImage = q.denodify(dayImageModel.findOne);
				dayImageModel.findOne({where: {day : dayNumber}}, function(err, dayImageNumber)
				{
					if (err || !dayNumber)
					{
						console.log("Could not find day image link, using base image");
					}
					else
					{
						console.log("Image found");
						dayImage = "dbImage.jpg";
					}
				});
				
				console.log("Day image: " + dayImage);
				return dayImage;
			};
			
			var combineVerses = function(verses)
			{
				var combinedVerses = '';
				for(var i = 0; i < verses.length; i++)
				{
					combinedVerses += verses[i].verse_text;
				}
				
				return combinedVerses;
			};
			
			var getVerseReferenceString = function(book, chapter, verseBegin, verseEnd)
			{
				return book + ' ' + chapter + ':' + verseBegin + '-' + verseEnd;
			}
			
			var dam_id = getVolume(verse.book_id, language);
	 
			var dbtUrl = 'http://dbt.io/text/verse?v=2&key=' +
			  dbpApiKey +
			  '&book_id=' + verse.book_id + '&chapter_id=' + verse.chapter_id +
			  '&verse_start=' + verse.verse_start + '&verse_end=' + verse.verse_end +
			  '&dam_id=' + dam_id;
			
			http.get(dbtUrl, function(dbtResponse) {
			   dbtResponse.on('data', function (chunk)
			   {
				var verses = JSON.parse(chunk);

				var combinedVerses = combineVerses(verses);
				var verseReference = getVerseReferenceString(verse.book_id, verse.chapter_id, verse.verse_start, verse.verse_end);
				var dayImage = getDayImage(rday);
				
				res.send({scripture : combinedVerses, reference: verseReference, image : dayImage, dbp:{fullLink : dbtUrl }});
			  });
			}).on('error', function(e) {
			  res.send("Got error: " + e.message);
			});
			//res.send(dbtUrl);
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
