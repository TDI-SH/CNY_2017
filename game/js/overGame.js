var OverGame = (function () {
    var container = document.querySelector('.container');

    var msg = document.querySelector('.gameover__msg');
    var score = document.querySelector('.gameover__score');
    var form = document.querySelector('.gameover__form');
    var btns = document.querySelector('.gameover_btns');

    var scoreboard = document.querySelector('.scoreboard');

    var game;

    addListeners();
    function init(_game) {
        game = _game;

        document.querySelector('.container').style.display = 'block';
        score.textContent = INME.Vars.score;

        checkScoreVsTenth();
    }

    function checkScoreVsTenth() {
        if (INME.Vars.score > INME.Vars.tenthScore) {//超过第10名        
            if (INME.cookie.get('name') === undefined || INME.cookie.get('email') === undefined) {//没有玩家信息
                msg.textContent = INME.getCopy('overtenth');
                resetForm(true);
            }
            else {//已有玩家的信息
                msg.textContent = INME.cookie.get('name') + INME.getCopy('overtenth');
                resetForm(false);
                updateScore();
            }
        }
        else {
            if (INME.cookie.get('name') === undefined || INME.cookie.get('email') === undefined) {
                msg.textContent = INME.getCopy('lesstenth');
            }
            else {
                msg.textContent = INME.cookie.get('name') + INME.getCopy('lesstenth');
            }
        }
    }

    var name;
    var email;
    function submitForm(e) {
        e.preventDefault();//阻止默认提交行为

        name = document.querySelector('input[name="name"]').value;
        email = document.querySelector('input[name="email"]').value;
        if (name !== '' || email !== '') {
            var data = {
                name: name,
                email: email,
                score: INME.Vars.score,
            }
            INME.ajax('POST', '../server/add.php', data, addUser);
        }
    }

    function addUser() {
        console.log('添加user成功');

        resetForm(false);
        INME.cookie.set('name', name, new Date(2020, 0, 1));
        INME.cookie.set('email', email, new Date(2020, 0, 1));
    }

    function updateScore() {
        var data = {
            name: INME.cookie.get('name'),
            email: INME.cookie.get('email'),
            score: INME.Vars.score,
        }
        INME.ajax('POST', '../server/update.php', data, function () {
            console.log('更新用户的分数成功');
        });        
    }

    function addListeners() {
        //gameover
        document.querySelector('.gameover__btnReplay').addEventListener('click', replay, false);
        document.querySelector('.gameover__btnHome').addEventListener('click', goHome, false);
        document.querySelector('.gameover__btnViewTop').addEventListener('click', viewTop10, false);
        form.addEventListener('submit', submitForm, false);
        document.querySelector('input[type="button"]').addEventListener('click', function () {////skip
            resetForm(false);
            viewTop10();
        }, false);
        //scoreboard
        document.querySelector('.scoreboard__btnReplay').addEventListener('click', replay, false)
        document.querySelector('.scoreboard__btnHome').addEventListener('click', goHome, false);
        document.querySelector('.scoreboard__btnClose').addEventListener('click', closeTop10, false);
    }

    function replay() {
        game.state.start(INME.State.Key.InGame);
        resetDom();
    }
    function goHome() {
        game.state.start(INME.State.Key.StartGame);
        resetDom();
    }
    function resetDom() {
        container.style.display = 'none';
        scoreboard.style.display = 'none';
        resetForm(false);
    }

    function resetForm(showForm) {
        if (showForm) {
            form.style.display = 'block';
            btns.style.display = 'none';
        }
        else {
            form.style.display = 'none';
            btns.style.display = 'block';
        }
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

            tds[i * 3].textContent = rank;
            tds[i * 3 + 1].textContent = name;
            tds[i * 3 + 2].textContent = score;
        }
    }

    return {
        init: init
    }
})();