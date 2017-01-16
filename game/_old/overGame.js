(function () {
    // gameover
    INME.State.OverGame = {
        create: function () {
            gameOverGroup = this.game.add.group();
            gameOverBg = this.add.sprite(0, 0, "msgBg");
            gameOverBg.anchor.setTo(.5, .5);
            gameOverGroup.add(gameOverBg);

            var txt = this.game.add.text(0, -80, 'GAME OVER', { fontSize: '30px', fill: '#fff' });
            txt.anchor.setTo(.5, .5);
            gameOverGroup.add(txt);

            var score = this.game.add.text(0, -50, 'SCORE:' + INME.Vars.score, { fontSize: '24px', fill: '#fff' });
            score.anchor.setTo(.5, .5);
            gameOverGroup.add(score);

            var play = this.game.add.button(0, -10, 'playBtn', this.playAgain, this);
            play.anchor.setTo(.5, .5);
            play.scale.setTo(.7, .7);
            play.input.useHandCursor = true;
            gameOverGroup.add(play);

            var submit = this.game.add.button(-80, 50, 'submit', this.submitScore, this);
            submit.anchor.setTo(.5, .5);
            submit.scale.setTo(.7, .7);
            submit.input.useHandCursor = true;
            gameOverGroup.add(submit);

            var view = this.game.add.button(80, 50, 'viewScore', this.viewHighScore, this);
            view.anchor.setTo(.5, .5);
            view.scale.setTo(.7, .7);
            view.input.useHandCursor = true;
            gameOverGroup.add(view);

            var shareSina = this.game.add.button(-120, 90, 'share', function () {
                this.shareFn('sina');
            }, this);
            shareSina.anchor.setTo(.5, .5);
            shareSina.scale.setTo(.7, .7);
            shareSina.frame = 0;
            shareSina.input.useHandCursor = true;
            gameOverGroup.add(shareSina);

            var shareWechat = this.game.add.button(-40, 90, 'share', function () {
                this.shareFn('wechat');
            }, this);
            shareWechat.anchor.setTo(.5, .5);
            shareWechat.scale.setTo(.7, .7);
            shareWechat.frame = 1;
            shareWechat.input.useHandCursor = true;
            gameOverGroup.add(shareWechat);

            var shareTwitter = this.game.add.button(40, 90, 'share', function () {
                this.shareFn('twitter');
            }, this);
            shareTwitter.anchor.setTo(.5, .5);
            shareTwitter.scale.setTo(.7, .7);
            shareTwitter.frame = 2;
            shareTwitter.input.useHandCursor = true;
            gameOverGroup.add(shareTwitter);

            var shareFace = this.game.add.button(120, 90, 'share', function () {
                this.shareFn('facebook');
            }, this);
            shareFace.anchor.setTo(.5, .5);
            shareFace.scale.setTo(.7, .7);
            shareFace.frame = 3;
            shareFace.input.useHandCursor = true;
            gameOverGroup.add(shareFace);

            gameOverGroup.position.x = this.game.world.centerX;
            gameOverGroup.position.y = this.game.world.centerY;
            gameOverGroup.alpha = 0;
            this.game.add.tween(gameOverGroup).to({
                alpha: 1
            }, 1000, Phaser.Easing.Bounce.Out, true, 0, 0, false);


        },
        playAgain: function () {
            console.log('play again');
            this.game.state.start(INME.State.Key.StartGame);
        },
        //提交分数
        submitScore: function () {
            console.log('submit');

            document.querySelector('.container').style.display = 'block';
            document.querySelector('.submitscore').style.display = 'block';


        },
        //查看top10榜单
        viewHighScore: function () {
            console.log('view high score');

            document.querySelector('.container').style.display = 'block';
            document.querySelector('.scoreboard').style.display = 'block';
            INME.ajax('GET', '../server/score.php', null, getTop10);
        },
        shareFn: function (obj) {
            var sinaShareURL = "http://service.weibo.com/share/share.php?";
            var host_url = document.location;
            var title = 'share test';
            var pic = '';
            if (obj == "sina") {
                _URL = sinaShareURL + "url=" + host_url + "&title=" + title + "&pic=" + pic;
                window.open(_URL);
            } else if (obj == "wechat") {
                console.log('wechat');
            } else if (obj == "facebook") {
                console.log('facebook');
            } else if (obj == 'twitter') {
                console.log('twitter');
            }

        }
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

    function addListener() {
        //关闭
        document.querySelector('.container__btnclose').addEventListener('click', closeContainer, false);
        //表达提交
        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();//阻止默认提交行为
            var name = document.querySelector('input[name="name"]').value;
            var email = document.querySelector('input[name="email"]').value;
            if (name !== '' || email !== '') {
                var data = {
                    name: name,
                    email: email,
                    score: INME.Vars.score,
                }
                INME.ajax('POST', '../server/add.php', data, addUser);
            }
        }, false);
    }

    function addUser() {

        console.log('添加user成功');

        closeContainer();
    }

    function closeContainer() {
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.scoreboard').style.display = 'none';
        document.querySelector('.submitscore').style.display = 'none';
    }

    addListener();
})();