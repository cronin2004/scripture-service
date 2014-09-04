
function DigitalBiblePlatform()
{
	this.fullLink = null;
	this.audioUrl = null;
	this.videoUrl = null;
}

function ScriptureResponse()
{
	this.scripture = null;
	this.combinedVerses = null;
	this.reference = null;
	this.image = "baseImage.bmp";
	this.dbp = DigitalBiblePlatform();
}

function ScriptureServiceModel(app, key)
{
	// Base stuff I need from the app for functionality
	this.dayImageModel = app.models.day_image;
	this.languageModel = app.models.supported_dbp_language;
	this.verseModel = app.models.supported_dbp_verse;
	this.versionModel = app.models.supported_dbp_version;
	this.apiKey = key;
}


exports = ServiceModel = null;

// this decides which volume to use based on the book requested.
var GetVolume = function (book, language) {

	var ntBooks = ['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
	var versionCode = ntBooks.indexOf(book) > -1 ? 'ESVN2ET' : 'ESVO2ET'
	versionCode = language + versionCode;
	console.log("Version Code: " + versionCode);
	return versionCode;
};

var GenerateDBTUrl = function(key, bookId, verseId, verseStart, verseEnd, damId)
{
	return 'http://dbt.io/text/verse?v=2&key=' + key + 
	'&book_id=' + bookId + 
	'&chapter_id=' + chapterId + 
	'&verse_start=' + verseStart + 
	'&verse_end=' + verseEnd + 
	'&dam_id=' + damId;
}

var FindDayImageAndSend = function(dayNumber, SendIt)
{
	dayImageModel.findOne({where: {day : dayNumber}}, function(err, dayImageNumber)
	{
		if (err || !dayNumber)
		{
			console.log("Could not find day image link, using base image");
		}
		else
		{
			console.log("Image found");
			dayImage = dayImageNumber.image_source;
		}
	});
	
	console.log("Day image: " + dayImage);
	//return dayImage;
};

var CombineVerses = function(verses)
{
	var combinedVerses = '';
	for(var i = 0; i < verses.length; i++)
	{
		combinedVerses += verses[i].verse_text;
	}
	
	return combinedVerses;
};

var GenerateVerseReferenceString = function(book, chapter, verseBegin, verseEnd)
{
	return book + ' ' + chapter + ':' + verseBegin + '-' + verseEnd;
}

	this.GetVerse = function(err, verse)
	{
		if (err)
		{
			res.send("Error: could not find verse");
		}
		else if (verse)
		{

			var dam_id = getVolume(verse.book_id, language);
	 
			var dbtUrl = GenerateDBTUrl(dbpApiKey, verse.book_id, verse.chapter_id, verse.verse_start, verse.verse_end, dam_id);
			
			http.get(dbtUrl, function(dbtResponse) {
			   dbtResponse.on('data', function (chunk)
			   {
				var verses = JSON.parse(chunk);

				var combinedVerses = CombineVerses(verses);
				var verseReference = GetVerseReferenceString(verse.book_id, verse.chapter_id, verse.verse_start, verse.verse_end);
				var dayImage = GetDayImage(rday);
				
				res.send({scripture : combinedVerses, reference: verseReference, image : dayImage, dbp:{fullLink : dbtUrl}});
			  });
			}).on('error', function(e) {
			  res.send("Got error: " + e.message);
			});
		}
		else
		{
			res.send("no instance found");
		}
	};
	
	// Function for for the /GET method for the Scripture Service.
	this.GetVerseById = function(req, res) {
		var rid = req.params.id;
		var rday = req.query.d;
		var language = req.query.l;

		console.log("Language: " + language);
		
		
		
		// First get the verse id;
		verseModel.findOne({where: { id : rid }}, GetVerse);
	};

};