var OverGame = (function () {
    var msg = document.querySelector('.gameover__msg');
    var score = document.querySelector('.gameover__score');
    var form = document.querySelector('.gameover__form');
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
            msg.textContent = INME.getCopy('overtenth');
            if (INME.cookie.get('name') === undefined || INME.cookie.get('email')) {//没有玩家信息
                form.style.display = 'block';
            }
            else {//已经有玩家的信息
                updateScore();
            }
        }
        else {//未超过第10名
            msg.textContent = INME.getCopy('lesstenth');
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

        form.style.display = 'none';
        INME.cookie.set('name', name, new Date(2020, 0, 1));
        INME.cookie.set('email', email, new Date(2020, 0, 1));
    }

    function updateScore() {

    }

    function addListeners() {
        //gameover
        document.querySelector('.gameover__btnReplay').addEventListener('click', function () {
            document.querySelector('.container').style.display = 'none';
            game.state.start(INME.State.Key.InGame);
        }, false);
        document.querySelector('.gameover__btnHome').addEventListener('click', function () {
            game.state.start(INME.State.Key.StartGame);
            document.querySelector('.container').style.display = 'none';
        }, false);
        document.querySelector('.gameover__btnViewTop').addEventListener('click', function () {
            viewTop10();
        }, false);
        form.addEventListener('submit', submitForm, false);
        //scoreboard
        document.querySelector('.scoreboard__btnclose').addEventListener('click', function () {
            document.querySelector('.scoreboard').style.display = 'none';
        }, false)
    }

    function viewTop10() {
        document.querySelector('.scoreboard').style.display = 'block';
        INME.ajax('GET', '../server/score.php', null, getTop10);
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