var express = require('express');
var router = express.Router();
var util = require('util');

var classIcons = {
    Druid: '/images/class-druid.png',
    Hunter: '/images/class-hunter.png',
    Mage: '/images/class-mage.png',
    Paladin: '/images/class-paladin.png',
    Priest: '/images/class-priest.png',
    Rogue: '/images/class-rogue.png',
    Shaman: '/images/class-shaman.png',
    Warlock: '/images/class-warlock.png',
    Warrior: '/images/class-warrior.png'
};

var emoteIcons = {
    'Kappa': {command:'!kpm'},
    'PJSalt': {command:'!pjpm'},
    'PogChamp': {command:'!popm'},
    'BibleThump': {command:'!bipm'},
    'BabyRage': {command: '!bapm'},
    'ThunBeast': {command: '!tpm'},
    'FrankerZ': {command: '!fpm'},
    '4Head': {command: '!4pm'},
    'forsenSnus': {command: '!spm'}
};

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Welcome!'});
});

/* GET Commands */
router.get('/commands', function(req, res){
    res.render('commands', { title: 'Snusbot Commands', commands: req.customCommands, twitchEmotes: emoteIcons, emoteNames: Object.keys(emoteIcons)});
});

/* GET history */
router.get('/history', function(req, res){
    res.render('history', { title: 'Decks', decks: req.cardEntries, icons: classIcons, decknames: Object.keys(req.cardEntries)});
});

/* GET Donate */
router.get('/donate', function(req, res){
    res.render('donate', { title: 'Support the Snus Brotherhood!'});
});

/* ###################################################### */
router.get('/login', function(req, res){
    var clientHash = req.query['hash'];
    var pageTitle = 'RaidCall Information';
    if(clientHash in authorizedClients) {
        iologger.logIO('Logging ' + authorizedClients[clientHash].clientUsername + ' in.')
        var authClient = authorizedClients[clientHash];
        res.render('login', {title: pageTitle, isValid: true, login: false, twitchUsername: authClient.clientUsername, socket: false})
    } else {
        res.render('login', {title: pageTitle, isValid: false, login: true, socket: true})
    }
});

router.get('/auth', function(req,res) {
    res.render('auth', {title: 'Authentication', auth: true, socket: true})
})

/* ################################################################### */

var crypto = require('crypto')
var server = require('http').Server(express);
var io = require('socket.io')(server, {origins:'149.210.138.162:* http://149.210.138.162:*'});

var twitchAccess = require('../twitch-access.js')
var iologger = require('../iologger.js')

var clientSockets = {};
var authorizedClients = {};

var socketIOPort = 3008;

server.listen(socketIOPort, function() {
    iologger.logIO('Socket.IO server started at port '+socketIOPort)
    io.on('connection', function (socket) {
        var gen_hash = getSocketHash(socket);
        socket.on('client_hash_req', function() {
            clientSockets[gen_hash] = {
                stored_socket: socket
            };
            //iologger.logIO('Storing socket under: ' + gen_hash)
            socket.emit('client_hash', gen_hash);
        })
        socket.on('init_auth', function(data) {
            iologger.logIO('starting auth for hash: ' + data.client_hash)
            try {
                var authSocket = clientSockets[data.client_hash].stored_socket;
                if(authSocket) {
                    var clientObject = {
                        connectedSocket: authSocket,
                        code: data.api_code,
                        clientHash: data.client_hash
                    }
                    twitchAccess.checkSubscription(clientObject, function(username, sub_status, message) {
                        if(sub_status) {
                            clientObject.connectedSocket.emit('auth_msg', {status: 'ok', message:'Subscription for ' + username + ' confirmed!'})
                            if(!(username in authorizedClients)) {
                                authorizedClients[clientObject.clientHash] = {
                                    clientObject: clientObject,
                                    clientUsername: username,
                                    timestamp: new Date()
                                }
                                iologger.logIO('Storing authentication for user: '+username)
                                setTimeout(function(){
                                    clientObject.connectedSocket.emit('auth_redir', {url: '/login'})
                                },600);
                            }
                        } else {
                            clientObject.connectedSocket.emit('auth_msg', {status: 'err', message:'Unable to confirm subscription! ' + message})
                        }
                    })
                }
            } catch(error) {
                iologger.logIO('Encountered error while retrieveing stored socket!\n'+error)
            }

        });
        socket.on('disconnect', function() {
            if(gen_hash && gen_hash in clientSockets) {
                delete clientSockets[gen_hash];
            }
        })
    });
});

function hashKey(unhashed) {
    var hashed = crypto.createHash('sha1').update(unhashed);
    return hashed.digest('base64');
}

function getSocketHash(socket) {
    return hashKey(socket.id + socket.handshake.address)
        .replace('&','')
        .replace('#','')
        .replace('=','')
        .replace(/\+/g,'')
        .replace(/\//g,'')
	    .replace(/ /g,'');
}

setInterval(function() {
    var authClientKeys = Object.keys(authorizedClients);
    if(authClientKeys.length>0) {
        var now = new Date();
        var twoMinutesAgo = new Date(now - 2 * 60000);
        for(var i = 0; i<authClientKeys.length; i++) {
            var currentClientKey = authClientKeys[i]
            var authTimestamp = authorizedClients[currentClientKey].timestamp;
            if(authTimestamp < twoMinutesAgo) {
                iologger.logIO('Removing ' + authorizedClients[currentClientKey].clientUsername + ' from auth obj.')
                delete authorizedClients[currentClientKey];
            }
        }
    }
},10000);



/* ################################################################### */

module.exports = router;
