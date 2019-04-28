var emotes = {
    'Kappa': {pattern: /Kappa/gm},
    'PJSalt': {pattern: /PJSalt/gm},
    'PogChamp': {pattern: /PogChamp/gm},
    'BibleThump': {pattern: /BibleThump/gm},
    'BabyRage': {pattern: /BabyRage/gm},
    'ThunBeast': {pattern: /ThunBeast/gm},
    'FrankerZ': {pattern: /FrankerZ/gm},
    '4Head': {pattern: /4Head/gm},
    'forsenSnus': {pattern: /forsenSnus/gm},
    'DansGame': {pattern: /DansGame/gm},
    'EleGiggle': {pattern: /EleGiggle/gm},
    'SwiftRage': {pattern: /SwiftRage/gm},
	'ANELE': {pattern:/ANELE/gm},
	'forsenAbort': {pattern:/forsenAbort/gm},
	'forsenSheffy': {pattern:/forsenSheffy/gm}
};

function createDiv(index, name) {
    var urlStr = "url('/images/emotes.png')";
    index = -30*index;
    return '<span style="display: inline-block; width: 40px; height: 30px; margin-bottom: -8px; background:'+urlStr+' no-repeat 0px ' + index +'px" title="' + name + '" />';
}

$(document).ready(function() {
    $('.custom p.text').each(function() {
        var $p = $(this);
        var html = $p.html();
        var emoteKeys = Object.keys(emotes);
        for (var emoteKeyIndex in emoteKeys) {
            if(html.contains(emoteKeys[emoteKeyIndex])) {
//                console.log('emote name: ' + emoteKeys[emoteKeyIndex])
//                console.log('found match at index i = ' + emoteKeyIndex)
                var emotePattern = emotes[emoteKeys[emoteKeyIndex]].pattern;
                var emoteImage = createDiv(emoteKeyIndex,emoteKeys[emoteKeyIndex]);
                var repHtml = html.replace(emotePattern, emoteImage);
                $p.html(repHtml);
                break;
            }
        }
    });
});

