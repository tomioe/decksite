function authenticate() {
    var windowWidth = 380;
    var windowHeight = 590;
    var left = (screen.width/2)-(windowWidth/2);
    var top = (screen.height/2)-(windowHeight/2);
    var windowUrl = 'https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=mjskka8m7r0sh5g7l6q2jhnrygxl010&redirect_uri=http://149.210.138.162:69/auth&scope=user_subscriptions&state='+client_hash;
    window.open(windowUrl, 'Twitch - Authorize Application', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+windowWidth+', height='+windowHeight+', top='+top+', left='+left);
}

var client_hash;
var socket;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function() {
    var a = getParameterByName('debug');
    socket = io.connect('149.210.138.162:3008');

    socket.on('connect', function () {
        socket.emit('client_hash_req');
        if(a){
            console.log('Connected to server socket.')
        }
    });
    socket.on('client_hash', function(data) {
        if(a) {
            console.log('Received authentication key: \'' + data+'\'')
        }
        client_hash = data;
    });
    socket.on('auth_msg', function(data){
        if(a) {
            console.log('Received message from server: \''+data.message+'\', with status \''+data.status+'\'.');
        }
        $('span.message').text(data.message);
        $('span.image').html('<img src="/images/' + data.status + (data.status === 'wait' ? '.gif' : '.png') + '" />');
    })
    socket.on('auth_redir', function(data) {
        if(!a) {
            window.location.replace(data.url+'?hash='+client_hash);
        } else {
            console.log('Server redirected to \''+data.url+'\'');
        }
    })
});
