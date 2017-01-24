var OverGame = (function () {
    var container = document.querySelector('.container');

    var score = document.querySelector('.gameover__score');
    var form = document.querySelector('.gameover__addplayer');
    var inputName = document.querySelector('.addplayer__input-name');
    var inputEmail = document.querySelector('.addplayer__input-email');

    var btns = document.querySelector('.gameover__btns');

    var scoreboard = document.querySelector('.scoreboard');

    var game;

    (function addListeners() {
        //gameover
        document.querySelector('.gameover__btnReplay').addEventListener('click', replay, false);
        document.querySelector('.gameover__btnHome').addEventListener('click', goHome, false);
        document.querySelector('.gameover__btnViewTop').addEventListener('click', viewTop10, false);
        document.querySelector('.addplayer__btnSubmit').addEventListener('click', addPlayer, false);
        document.querySelector('.addplayer__btnSkip').addEventListener('click', function () {//skip button
            showAddPlayer(false);
            viewTop10();
        }, false);
        //scoreboard
        document.querySelector('.scoreboard__btnReplay').addEventListener('click', replay, false)
        document.querySelector('.scoreboard__btnHome').addEventListener('click', goHome, false);
        document.querySelector('.scoreboard__btnBack').addEventListener('click', closeTop10, false);
        //阻止input的默认行为
        name = inputName.addEventListener('focus', preventInputDefault, false);
        email = inputEmail.addEventListener('focus', preventInputDefault, false);
        function preventInputDefault(e) {
            e.preventDefault();
        }
        //微信弹出窗
        var popupWechat = document.querySelector('.popup__wechat');
        popupWechat.addEventListener('click', function () {
            popupWechat.style.display = 'none';
        }, false);

        document.querySelector('#wechat').addEventListener('click', function () {
            popupWechat.style.display = 'block';
        }, false);
    })();

    var needUpdate = true;
    function init(_game) {
        game = _game;
        container.style.display = 'block';
        score.textContent = INME.getCopy('score') + INME.Vars.score;
        checkScoreVsTenth();

        if (needUpdate) {
            updateWechatImg();
            updateLanImg();
            needUpdate = false;
        }
    }

    function checkScoreVsTenth() {
        if (INME.Vars.score > INME.Vars.tenthScore) {//超过第10名的分数
            showLessTenth(false);
            if (INME.cookie.get('name') === undefined || INME.cookie.get('email') === undefined) {//没有玩家信息
                showAddPlayer(true);
            }
            else {//已经有玩家的信息
                showAddPlayer(false);
                updatePlayerScore();
            }
        }
        else {
            showLessTenth(true);
            if (INME.cookie.get('name') === undefined || INME.cookie.get('email') === undefined) {
            }
            else {
            }
        }
    }

    //提交表单
    var name;
    var email;
    function addPlayer(e) {
        name = inputName.value;
        email = inputEmail.value;
        if (name !== '' && email !== '') {
            var data = {
                name: name,
                email: email,
                score: INME.Vars.score,
            }
            INME.ajax('POST', '../server/add.php', data, addNewPlayerComplete);
        }
    }

    function addNewPlayerComplete() {
        console.log('添加user成功');

        showAddPlayer(false);
        viewTop10();//跳转到榜单页面
        INME.cookie.set('name', name, new Date(2020, 0, 1));
        INME.cookie.set('email', email, new Date(2020, 0, 1));
    }

    function updatePlayerScore() {
        var data = {
            name: INME.cookie.get('name'),
            email: INME.cookie.get('email'),
            score: INME.Vars.score,
        }
        INME.ajax('POST', '../server/add.php', data, function () {
            console.log('更新用户的分数成功');
        });
    }


    function replay() {
        game.state.start(INME.State.Key.InGame);
        resetContainer();
    }
    function goHome() {
        game.state.start(INME.State.Key.StartGame);
        resetContainer();
    }

    function viewTop10() {
        scoreboard.style.display = 'block';
        INME.ajax('GET', '../server/score.php', null, getTop10);
    }

    function closeTop10() {
        scoreboard.style.display = 'none';
    }

    function getTop10(data) {
        var players = data['scorelist'];
        var len = players.length;
        var tds = document.querySelectorAll('td');
        for (var i = 0; i < len; i++) {
            var player = players[i];
            var rank = i + 1;
            var name = player.name;
            var score = player.score;

            tds[i * 3].textContent = rank + '.';
            tds[i * 3 + 1].textContent = name;
            tds[i * 3 + 2].textContent = score;
        }

        //获得此时第10名的分数，并更新INME.Vars.tenthScore
        var lastIndex = len - 1;
        if (lastIndex > -1) {
            INME.Vars.tenthScore = players[lastIndex].score;
            console.log('获取第10名的分数成功,getTop10', INME.Vars.tenthScore);
        }

    }

    function resetContainer() {
        container.style.display = 'none';
        scoreboard.style.display = 'none';
        showAddPlayer(false);
        showLessTenth(false);
    }

    function showLessTenth(lesstenth) {
        var msgOverTenth = document.querySelector('.msg__overtenth');
        var msgLessTenth = document.querySelector('.msg__lesstenth');
        if (lesstenth) {
            msgLessTenth.style.display = 'block';
            msgOverTenth.style.display = 'none';
            score.classList.add('gameover__score_lesstenth');
            btns.classList.add('gameover__btns_lesstenth');
        }
        else {
            msgLessTenth.style.display = 'none';
            msgOverTenth.style.display = 'block';
            score.classList.remove('gameover__score_lesstenth');
            btns.classList.remove('gameover__btns_lesstenth');
        }
    }

    function showAddPlayer(showAddPlayer) {
        if (showAddPlayer) {
            //更新placeholder
            inputName.placeholder = INME.getCopy('input_name_placeholder');
            inputEmail.placeholder = INME.getCopy('input_email_placeholder');

            form.style.display = 'block';
            btns.style.display = 'none';
        }
        else {
            form.style.display = 'none';
            btns.style.display = 'block';
        }
    }

    function updateWechatImg() {
        function isWechat() {
            return (/micromessenger/i).test(navigator.userAgent);
        }

        var mark = isWechat() ? 'wechat' : 'nowechat';
        var format = '.png';

        document.querySelector('.wechat__bg').src = 'assets/overgame/wechatBg_' + mark + format;
        document.querySelector('.wechat__msg').src = 'assets/overgame/wechatMsg_' + mark + '_' + INME.Vars.language + format;
    }

    //更新对应语言版本的图片
    function updateLanImg() {
        var format = '.png';//假定格式全为.png
        var imgs = document.querySelectorAll('.container img');
        Array.prototype.forEach.call(imgs, function (img) {
            var src = img.src;
            var _index = src.lastIndexOf('_');
            var dotIndex = src.lastIndexOf('.');
            if (_index !== -1 && dotIndex !== -1) {
                var lan = src.substring(_index + 1, dotIndex);
                var path = src.substring(0, _index);
                if (INME.Vars.languages.indexOf(lan) !== -1) {
                    if (lan !== INME.Vars.language) {
                        var newPath = path + '_' + INME.Vars.language + format;
                        img.src = newPath;
                    }
                }
            }
        });
    }


    return {
        init: init
    }
})(); 
