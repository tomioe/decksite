$(document).ready(function() {
    if(window.opener) {
        var sock = io.connect('http://149.210.138.162:3008');
        var error_msg = getParameterByName('error');
        if(!error_msg) {
            var client_hash = getParameterByName('state');
            var code = getParameterByName('code')
            sock.emit('init_auth', {api_code: code, client_hash: client_hash})
        }
        setTimeout(function(){window.close();},300);
    } else {
        setTimeout(function(){window.location.replace("/")},50);
    }
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}