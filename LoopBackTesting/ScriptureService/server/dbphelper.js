var RSVP = require('rsvp'),
    request = require('request'),
    _ = require('lodash');

function dbpHelper() {
    var ntBooks = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'];
    var self = this;
	var dbpApiKey = '';

    var exports = {
		
		// This decides which volume to use based on the book requested.
        GetVolume: function(book, language, version) {
            var versionCode = language + version;
			versionCode += ntBooks.indexOf(book) > -1 ? 'N2ET' : 'O2ET';
            console.log("Version Code: " + versionCode);
            return versionCode;
        },
		
		// Concatenates all verses into a user friendly string.
        CombineVerses: function(verses) {
            var combinedVerses = '';
            for (var i = 0; i < verses.length; i++) {
                combinedVerses += verses[i].verse_text;
            }

            return combinedVerses;
        },
		
		// Gets the verse reference string based on the book, chapter and veres.
        GetVerseReferenceString: function(book, chapter, verseBegin, verseEnd) {
            return book + ' ' + chapter + ':' + verseBegin + '-' + verseEnd;
        },
		
		// An asynchronous method that gets gets the actual scripture verse in a specified language.
        GetScripture: function(verse, language, version) {
			var dam_id = this.GetVolume(verse.book_id, language, version);
			var dbtUrl = 'http://dbt.io/text/verse?v=2&key=' +
				this.dbpApiKey +
				'&book_id=' + verse.book_id + '&chapter_id=' + verse.chapter_id +
				'&verse_start=' + verse.verse_start + '&verse_end=' + verse.verse_end +
				'&dam_id=' + dam_id;

			var result = new RSVP.Promise(function(resolve, reject) {
				request.get({
					url: dbtUrl,
					json: true
				}, function(e, r, verses) {
					if (e) {
						reject(e);
					} else {
						resolve({
							verses: verses,
							dbtUrl: dbtUrl
						});
					}
				});
			});

            return result;
        }
    };

    _.bindAll(exports);
    return exports;
}

module.exports = dbpHelper;