var RSVP = require('rsvp')
, request = require('request')
, _ = require('lodash');

function dbpHelper (dbpApiKey) {
  var ntBooks = ['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
  var self = this;

  var exports = {
    // this decides which volume to use based on the book requested.
    getVolume: function (book, language) {
      var versionCode = ntBooks.indexOf(book) > -1 ? 'ESVN2ET' : 'ESVO2ET'
				versionCode = language + versionCode;
				console.log("Version Code: " + versionCode);
				return versionCode;
    },

    combineVerses: function (verses) {
      var combinedVerses = '';
      for(var i = 0; i < verses.length; i++)
      {
        combinedVerses += verses[i].verse_text;
      }

      return combinedVerses;
    },
    getVerseReferenceString: function(book, chapter, verseBegin, verseEnd)
    {
      return book + ' ' + chapter + ':' + verseBegin + '-' + verseEnd;
    },
    getScripture: function (verse, language) {
     var dam_id = this.getVolume(verse.book_id, language);
     var dbtUrl = 'http://dbt.io/text/verse?v=2&key=' +
			  dbpApiKey +
			  '&book_id=' + verse.book_id + '&chapter_id=' + verse.chapter_id +
			  '&verse_start=' + verse.verse_start + '&verse_end=' + verse.verse_end +
			  '&dam_id=' + dam_id;

      var result = new RSVP.Promise(function(resolve, reject) {
       request.get({url:dbtUrl, json:true}, function (e,r,verses) {
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

