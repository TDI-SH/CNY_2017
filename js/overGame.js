(function () {
    // gameover
    INME.State.OverGame = {
        preload: function () {

        },
        create: function () {
            this.gameOver();
        },
        update: function () {

        },
        gameOver: function () {
            gameOverGroup = this.game.add.group();
            gameOverBg = this.add.sprite(0, 0, "msgBg");
            gameOverBg.anchor.setTo(.5, .5);
            gameOverGroup.add(gameOverBg);

            var txt = this.game.add.text(0, -80, 'GAME OVER', { fontSize: '30px', fill: '#fff' });
            txt.anchor.setTo(.5, .5);
            gameOverGroup.add(txt);

            var score = this.game.add.text(0, -50, 'SCORE:1000', { fontSize: '24px', fill: '#fff' });
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

            var view = this.game.add.button(80, 50, 'viewScore', this.viewHightScore, this);
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
        submitScore: function () {
            console.log('submit');
            // this.game.state.start('submit');
        },
        viewHightScore: function () {
            console.log('view high score');
        },
        shareFn: function (obj) {
            var sinaShareURL = "http://service.weibo.com/share/share.php?";
            var qqShareURL = "http://share.v.t.qq.com/index.php?c=share&a=index&";
            var host_url = document.location;
            var title = 'share test';
            var pic = '';
            if (obj == "sina") {
                _URL = sinaShareURL + "url=" + host_url + "&title=" + title + "&pic=" + pic;
                window.open(_URL);
            } else if (obj == "qq") {
                _URL = qqShareURL + "url=" + host_url + "&title=" + title + "&pic=" + pic;
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
})();