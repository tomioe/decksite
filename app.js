var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var util = require('util');
var jf = require('jsonfile')
var fileHandler = require('fs');


var index = require('./routes/index');

var iologger = require('./iologger.js')


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.disable('x-powered-by');
app.disable('etag');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('public/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));


// socket.io x-origin stuff
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, *');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    };
});



// File names
var jsonCardFile = 'decks';
var jsonCommandFile = 'command_entries.json';
var loggingFile = 'decksite.log';

var cardEntries = {};
var customCommands = [];


app.post('/post-data', function(req, res){
    console.log('kappa')
    res.redirect('/post-deck');
})

app.post('/post-deck', function(req, res){
    iologger.logIO('Received JSON data')
    var obj = req.body;
    cardEntries.push(obj);
    jf.writeFile(jsonCardFile, cardEntries, function(err){
        if(err) {
            iologger.logIO('Could not write JSON deck data, ' + err);
            res.end('error');
       } else {
            res.writeHead(200);
            res.end('ok')
        }
    })
});


app.post('/post-command', function(req, res){
    iologger.logIO('Received Command JSON data')
    var obj = req.body;
    util.inspect(obj);
    customCommands.push(obj);
    jf.writeFile(jsonCommandFile, customCommands, function(err){
        if(err) {
            iologger.logIO('Could not write JSON command data, ' + err);
            res.writeHead(500)
            res.end('error');
        } else {
            res.writeHead(200);
            res.end('ok')
        }
    })

});

app.post('/delete-command', function(req, res) {
	iologger.logIO('Received command delete');
	var obj = req.body;
    var deleted = false;
    if(obj.trigger) {
        for(var i = 0; i<customCommands.length; i++) {
            var commandTrigger = customCommands[i].command.trigger;
            //console.log('Requesting: ' + obj.trigger + ', currently: ' + commandTrigger)
            if(commandTrigger.indexOf(obj.trigger) === 0) {
                customCommands.splice(i, 1);
                jf.writeFile(jsonCommandFile, customCommands, function(err){
                    if(err) {
                        iologger.logIO('Could not write JSON command data, ' + err);
                        res.writeHead(500);
                        res.end('error');
                    } else {
                        iologger.logIO('Deleted command ' + obj.trigger + ' successfully');
                        res.writeHead(200);
                        res.end('ok')
                        deleted = true;
                    }
                })
            }
        }

    }
    setTimeout(function(){
        if(!deleted) {
            iologger.logIO('Unable to find index.')
        }
        res.writeHead(400);
        res.end('error');
    },50);
});

function readDecks() {
    jf.readFile(jsonCardFile, function(err, obj){
        if(err) {
            iologger.logIO('Error reading JSON card entries')
            throw err;
        }
        iologger.logIO('Parsed JSON card entries from file')
        cardEntries = obj;
    })
}

function readCommands() {
    jf.readFile(jsonCommandFile, function(err, obj){
        if(err) {
            iologger.logIO('Error reading JSON command entries')
            throw err;
        }
        iologger.logIO('Parsed JSON command entries from file')
        customCommands = obj;
    })
}

readDecks();
readCommands();

fileHandler.watch(jsonCommandFile, function(event, filename) {
    iologger.logIO(event + ' happened on the command file, updating...');
    setTimeout(function(){
        readCommands();
    }, 500);
})

fileHandler.watch(jsonCardFile, function(event, filename) {
    iologger.logIO(event + ' happened on the Decks file, updating...');
    setTimeout(function() {
        readDecks();
    }, 500);
})




app.use(function (req, res, next) {
    req.cardEntries = res.cardEntries = cardEntries;
    req.customCommands = res.customCommands = customCommands;
    next();
});

app.use('/', index);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
