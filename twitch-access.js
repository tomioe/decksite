
var https = require('https');
var querystring = require('querystring');


var iologger = require('./iologger.js');

var client_id = 'm';
var client_secret = 'q';

var postOptions = {
    hostname: 'api.twitch.tv',
    port: 443,
    path: '/kraken/oauth2/token',
    method: 'POST'
};

var getOptions = {
    hostname: 'api.twitch.tv',
    port: 443,
    path: '/kraken/',
    method: 'GET',
    headers : {
        Accept: 'application/vnd.twitchtv.v3+json',
        Authorization: 'OAuth '
    }
}

var postBody = {
    client_id: client_id,
    client_secret: client_secret,
    grant_type: 'authorization_code',
    //redirect_uri: 'http://localhost:69/auth'
    redirect_uri: 'http://149.210.138.162:69/auth'
};

var twitchChannel = "forsenlol";

function retrieveSecretKey(clientObject, callback) {
    clientObject.connectedSocket.emit('auth_msg', {status: 'wait', message:'Connecting to Twitch...'})
    postBody.code = clientObject.code;
    var postBodyComp = querystring.stringify(postBody);
    postOptions.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postBodyComp.length
    }
    var apiReq = https.request(postOptions, function(p_response){
        var apiResponse = '';
        p_response.on('data', function(chunk) {
            apiResponse += chunk;
        }).on('end', function(){
            var finishedResponse = JSON.parse(apiResponse);
            retrieveUsername(finishedResponse.access_token, function(username, sub_status, message) {
                callback(username, sub_status, message);
            })
        })
    });
    apiReq.on('error', function(err){
        clientObject.connectedSocket.emit({status:'error', message:'Error in contacting Twitch, please try again later.'})
    });
    apiReq.write(postBodyComp);
    apiReq.end()
}


function retrieveUsername(secret_key, callback) {
    //iologger.logIO('Getting username')
    getOptions.headers.Authorization += secret_key;
    getOptions.path = '/kraken';
    var rootBody = '';
    var userGet = https.get(getOptions, function(resp1) {
        resp1.on('data', function(chunk){
            rootBody += chunk;
        }).on('end', function(){
            if (callback && typeof(callback) === "function") {
                try {
                    var rootObj = JSON.parse(rootBody);
                    //iologger.logIO('\tInspection\n'+util.inspect(rootObj))
                    var rootObjUsername = rootObj.token.user_name;
                    rootBody = '';
                    if(rootObjUsername) {
                        retrieveSubscriberStatus(rootObjUsername, secret_key, function(sub_stats, message) {
                            callback(rootObjUsername, sub_stats, message);
                        });
                    } else {
                        iologger.logIO('Error in parsing username! '+((resp1.statusCode) ? 'API response status code: ' + resp1.statusCode : ''));
                        callback(null, false, "Could not parse the API response.");
                    }
                } catch(exception) {
                    iologger.logIO('Response from API was invalid while retrieving username! Status code: ' + resp1.statusCode+ ' - '  + exception);
                    iologger.logIO('Response was: ' + rootBody)
                    callback(null, false, "Twitch API replied with an invalid response.");
                }
            } else {
                iologger.logIO('The "callback" argument to retrieveUsername was undefined or not a function!')
                callback(null, false, "Internal Error!")
            }
        }).on('error', function(err){
            iologger.logIO('Encountered error during root request: '+ err.message)
            callback(null, false, "Unable to contact Twitch servers, please try again later.");
        });
    }).end();
    getOptions.headers.Authorization = 'OAuth ';
}

function retrieveSubscriberStatus(username, secret_key, callback) {
    var newGetOpts = getOptions;
    newGetOpts.path += "/users/" + username + "/subscriptions/"+twitchChannel;
    newGetOpts.headers.Authorization += secret_key;
    var subBody = '';
    var subGet = https.get(newGetOpts, function(resp2) {
        resp2.on('data', function(chunk){
            subBody += chunk;
        }).on('end', function(){
            if (callback && typeof(callback) === "function") {
                try {
                    var responseCode  = resp2.statusCode;
                    //iologger.logIO('\tSub Inspection: \n' +util.inspect(JSON.parse(subBody)))
                    if(responseCode === 200) {
                        callback(true);
                    } else {
                        callback(false, "No subscription was found!");
                    }
                    subBody = '';
                } catch(exception) {
                    iologger.logIO('Response from API was invalid while retrieving sub status! Error: ' + exception);
                    callback(false, "Twitch API returned an invalid response.");
                }
            } else {
                iologger.logIO('The "callback" argument to retrieveSubscriberStatus was undefined or not a function!')
                callback(false, "Twitch API returned an error, please try again later.");
            }
        }).on('error', function(err){
            iologger.logIO('Encountered error during subscriber request: '+ err.message)
            callback(false, "Could not contact Twitch.");
        });
    }).end();
    newGetOpts.headers.Authorization = 'OAuth ';
}



module.exports = {
    checkSubscription: retrieveSecretKey
}
