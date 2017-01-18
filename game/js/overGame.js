var OverGame = (function () {
    var container = document.querySelector('.container');

    var score = document.querySelector('.gameover__score');
    var form = document.querySelector('.gameover__addplayer');
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
    })();

    function init(_game) {
        game = _game;
        container.style.display = 'block';
        score.textContent = INME.getCopy('score') + INME.Vars.score;
        checkScoreVsTenth();
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

        name = document.querySelector('.addplayer__input-name').value;
        email = document.querySelector('.addplayer__input-email').value;
        if (name !== '' && email !== '' && name !== 'NAME' && email !== 'E-MAIL') {
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

            tds[i * 3].textContent = rank+'.';
            tds[i * 3 + 1].textContent = name;
            tds[i * 3 + 2].textContent = score;
        }

        //获得此时第10名的分数，并更新INME.Vars.tenthScore
        var lastIndex = len - 1;
        if (lastIndex > -1) {
            INME.Vars.tenthScore = players[lastIndex].score;
        }
        console.log('获取第10名的分数成功,getTop10', INME.Vars.tenthScore);
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
            form.style.display = 'block';
            btns.style.display = 'none';
        }
        else {
            form.style.display = 'none';
            btns.style.display = 'block';
        }
    }


    return {
        init: init
    }
})(); 
