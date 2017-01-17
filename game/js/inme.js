var INME = INME || {};

INME = (function () {
    /**
     * tenthScore:
     * 第10名的分数;在1.游戏初始加载和2.查看top10榜单时,更新该值;并不是实时更新的;
     * 所以可能玩家的分数并不高于现在的第10名时,分数
     */
    var Vars = {
        characterIndex: 0,
        characterNum: 2,
        characterPrefix: 'chicken',
        language: 'sc',
        copyFontname: 'copy',
        tenthScore: 0,
    };

    var State = {
        Key: {
            Boot: 'Boot',
            Loading: 'Loading',
            Language: 'Language',
            Story: 'Story',
            Help: 'Help',
            StartGame: 'StartGame',
            InGame: 'InGame',
        },
    };

    var copy = {
        'lan': {
            'sc': '简体中文',
            'tc': '繁体中文',
            'en': 'English'
        },
        'play': {
            'sc': '开始',
            'tc': '開始',
            'en': 'play'
        },
        'score': {
            'sc': '分数:',
            'tc': '分數:',
            'en': 'Score:'
        },
        'next': {
            'sc': '下一步',
            'tc': '下一步',
            'en': 'Next'
        },
        'pre': {
            'sc': '上一步',
            'tc': '上一步',
            'en': 'Preview'
        },
        'landscape': {
            'sc': '请横屏玩耍',
            'tc': '請橫屏玩耍',
            'en': 'Please play in landscape'
        },
        'lesstenth': {
            'sc': '你没有进入前10名，请继续努力',
            'tc': '你沒有進入前10名，請繼續努力',
            'en': 'You do not have to enter the top 10, please continue to work'
        },
        'overtenth': {
            'sc': '恭喜你进入前10名',
            'tc': '恭喜你進入前10名',
            'en': 'Congratulations on your entry into the Top 10'
        },
        'chicken_1_name': {
            'sc': 'RONNIE',
            'tc': 'RONNIE',
            'en': 'RONNIE'
        },
        'chicken_2_name': {
            'sc': 'LILY',
            'tc': 'LILY',
            'en': 'LILY'
        },
    }
    //console.log(getCopy(lan));
    /**
     * 自定义按钮:背景＋文字
     * @param {function} callback - 点击按钮时的回调函数
     * @param {string} key - The image key (in the Game.Cache) to use as the bg texture
     * @param {string} text - 文字内容（默认值:'')
     * @param {number} size - 文字大小 (默认值:32) 
     * @param {string} anchorX - 按钮水平方向注册点（默认值:0.5）
     * @param {string} anchorY - 按钮垂直方向注册点 (默认值:0.5）
     */
    function Button(game, callback, callbackContext, key, text, size, anchorX, anchorY) {
        anchorX = anchorX === undefined ? 0.5 : anchorX;
        anchorY = anchorY === undefined ? 0.5 : anchorY;

        var bg = game.add.button(0, 0, key, callback, callbackContext, 1, 0, 1, 0);
        bg.anchor.set(anchorX, anchorY);

        var offsetX = (0.5 - anchorX) * bg.width;
        var offsetY = (0.5 - anchorY) * bg.height;

        var text = new Phaser.BitmapText(game, 0, 0, Vars.copyFontname, text, size);
        text.inputEnabled = false;
        bg.addChild(text);


        text.position.set(-text.width * 0.5 + offsetX, -text.height * 0.5 + offsetY);

        return bg;
    }

    /**
     * 返回对应语言版本的文字的BitmapText
     */
    function getCopyBT(game, x, y, key, size) {
        var text = getCopy(key);
        console.log(text);
        return game.add.bitmapText(x, y, Vars.copyFontname, text, size);
    }

    /**
     * 返回对应语言版本的文字
     */
    function getCopy(key) {
        return copy[key][Vars.language];
    }
    /**
     * ajax
     */
    function ajax(method, url, data, success, error) {
        if (error === undefined)
            error = function () { };

        var request = new XMLHttpRequest();
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                success(JSON.parse(request.responseText));
            } else {
                error();
            }
        };
        request.onerror = error;

        request.open(method, url, true);
        if (method === 'POST') {
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            if (data) {
                var str = '';
                for (var key in data) {
                    str += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&';
                }
                str = str.substring(0, str.length - 1);
                request.send(str);
            }
        }
        else {
            request.send();
        }
    }
    /**
     * 获得第10名的分数
     */
    (function getTenthScore() {
        ajax('GET', '../server/score.php', null, function (data) {
            var players = data['scorelist'];
            var len = players.length;
            var lastIndex = len - 1;
            if (lastIndex > -1) {
                INME.Vars.tenthScore = players[lastIndex].score;
            }
            console.log('获取第10名的分数成功,inme', INME.Vars.tenthScore);
        });
    })();

    return {
        Vars: Vars,
        State: State,
        Languages: copy.lan,
        getCopy: getCopy,
        getCopyBT: getCopyBT,
        Button: Button,
        ajax: ajax
    }
})();

INME.cookie = (function () {
    function get(name) {
        var cookieName = encodeURIComponent(name) + '=';
        var cookieStart = document.cookie.indexOf(cookieName);
        var cookieValue;
        if (cookieStart > -1) {
            var cookieEnd = document.cookie.indexOf(';', cookieStart);
            if (cookieEnd === -1) {
                cookieEnd = document.cookie.length;
            }
            cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length, cookieEnd));
        }
        return cookieValue;
    }
    function set(name, value, expires, path, domain, secure) {
        var cookieText = encodeURIComponent(name) + '=' + encodeURIComponent(value);
        if (expires instanceof Date) {
            cookieText += ';expires=' + expires.toGMTString();
        }
        if (path) {
            cookieText += ';path=' + path;
        }
        if (domain) {
            cookieText += ';domain' + domain;
        }
        if (secure) {
            cookieText += ';secure'
        }

        document.cookie = cookieText;
    }

    return {
        set: set,
        get: get
    }
})();




