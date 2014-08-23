var settings = require('./config');
var express = require('express');
var mysql = require('mysql');
var app = express(); 

var GetMethod = function(req, res) {
	var id = req.params.id;
	var date = req.query.d;
	var language = req.query.l;

    res.send({id:id, date:date, language:language});
};

app.get('/', function(req, res){ res.send('{}')});
app.get('/:id', GetMethod);
app.listen(settings.server.port);