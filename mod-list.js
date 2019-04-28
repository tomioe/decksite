var irc = require('irc');
var ircConfig = {
    server: 'irc.twitch.tv',
    port: 6667,
    nick:'snusbot',
    pw: 'oauth:39f792ul2o2g4r7ikv1vs0pn87uowi5'
}
module.exports = {
    updateModList: function(channel, callback){
        var bot = new irc.Client(ircConfig.server, ircConfig.nick, {
            port: ircConfig.port,
            password: ircConfig.pw,
            userName: ircConfig.nick,
            nick: ircConfig.nick,
            autoConnect: false,
            debug: false,
            showErrors: true,
            sasl: true
        });
        bot.connect(function() {
            //console.log('connecting')
        });
        bot.addListener('registered', function() {
            //console.log('Sending .mods')
            bot.say(channel, '.mods')
        })
        bot.addListener('pm', function(nick, text, message){
            if(text.indexOf("moderators")>1) {
                var listText = text.replace("The moderators of this room are: ", "");
                if (callback && typeof(callback) === "function") {
                    callback(listText.split(", "));
                    bot.disconnect(function() {
                        //console.log('disconnecting')
                    });
                    return;
                }
                callback();
            }
        })
    }
};