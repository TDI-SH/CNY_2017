(function () {
    var INME = INME || {};

    INME.Vars = {
        speed: 1,
        playerKey: 'chicken_1',
        velocity: -750,
        gravity: 1500,
    }

    INME.State = {
        Key: {
            Boot: 'Boot',
            Loading: 'Loading',
            Language: 'Language',
            Story: 'Story',
            StartGame: 'StartGame',
            InGame: 'InGame',
            OverGame: 'OverGame',
        },
    }

    /**
     * state - Boot
     */
    INME.State.Boot = {
        init: function () {
            this.game.stage.backgroundColor = 0xffffff;

            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            if (game.device.desktop) {
                console.log('桌面');

                game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;

            }
            else {
                console.log('手机');

                game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                //game.scale.forceOrientation(true, false);
            }
        },
        preload: function () {
            this.game.load.image('loadingbar', 'assets/images/loading/loadingbar.png');
        },
        create: function () {
            this.game.state.start(INME.State.Key.Loading);
        }
    }
    /**
     * state - Loading
     */
    INME.State.Loading = {
        init: function () {
            var lb = this.game.add.sprite(0, 268, 'loadingbar');

            this.game.load.setPreloadSprite(lb);
        },
        preload: function () {
            this.game.load.pack('common', 'assets/pack.json');
        },
        create: function () {
            this.game.state.start(INME.State.Key.Language);
        },
    }
    /**
     * state - Language
     */
    INME.State.Language = {
        create: function () {
            this.game.add.button(250, 250, 'btnLan', this.handleClick, this, 1, 0, 1, 0).name = 'btnCh';
            this.game.add.button(520, 250, 'btnLan', this.handleClick, this, 3, 2, 3, 2).name = 'btnEn';

        },
        handleClick: function (btn) {
            btnName = btn.name;

            this.game.state.start(INME.State.Key.Story);
        }
    }
    /**
     * state - Story
     */
    INME.State.Story = {
        create: function () {
            var video = this.game.add.video('backstory');
            video.addToWorld();
            video.play();

            video.onComplete.addOnce(function () {
                console.log('backstory ended, enter game');
                //this.game.state.start(INME.State.Key.StartGame);
            }, this);

            this.game.state.start(INME.State.Key.StartGame)//－－－测试
        }
    }
    /**
     * state - StartGame
     */
    INME.State.StartGame = {
        create: function () {
            this.game.add.button(385, 400, 'btnPlay', this.handleClick, this, 1, 0, 1, 0).name = 'btnPlay';
            this.game.add.button(870, 490, 'btnHelp', this.handleClick, this, 1, 0, 1, 0).name = 'btnHelp';
        },
        handleClick: function (btn) {
            btnName = btn.name;
            switch (btnName) {
                case 'btnPlay':
                    this.game.state.start(INME.State.Key.InGame);
                    break;
                case 'btnHelp':
                    break;
            }
        }
    }
    /**
     * state - InGame
     * 使用内置的tileSprite配合tilePosition属性制作背景视差滚动时,个别手机浏览器会比较卡。决定自己实现
     * 
     */
    INME.State.InGame = {
        create: function () {
            //物理
            game.physics.startSystem(Phaser.Physics.Arcade);
            //背景
            this.bg = new ParallaxSprite(this.game, 'bg_ingame', 0, 0);
            this.hill1 = new ParallaxSprite(this.game, 'hill1', 0, 276);
            this.hill2 = new ParallaxSprite(this.game, 'hill2', 0, 341);
            this.platform = game.add.group();
            this.platform.enableBody = true;
            var ground = this.platform.create(0, game.world.height - 64, 'ground');
            ground.scale.setTo(2.4, 2);
            ground.body.immovable = true;
            //玩家
            this.player = this.game.add.sprite(100, this.game.height - 448, INME.Vars.playerKey);
            this.player.animations.add('run', [5, 6, 7, 8], 10, true);
            this.player.animations.add('up', [4], 10, false);
            this.player.play('run');
            this.game.physics.arcade.enable(this.player);
            this.player.body.gravity.y = INME.Vars.gravity;
            this.player.body.collideWorldBounds = true;
            //control-keys
            spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            upArrow = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        },
        update: function () {
            this.scrollBg();
            // check if player is touching ground
            game.physics.arcade.collide(this.player, this.platform);
            // Jump when player is touching ground AND pressing spaceBar, upArrow, or tapping on mobile
            if ((upArrow.isDown && this.player.body.touching.down) || (spaceBar.isDown && this.player.body.touching.down) || (game.input.pointer1.isDown && this.player.body.touching.down) ) {
                this.player.body.velocity.y = INME.Vars.velocity;
            }
            if (!this.player.body.touching.down) {
                this.player.play('up');
            }
            else {
                this.player.play('run');
            }
        },
        scrollBg: function () {
            this.bg.scroll(-INME.Vars.speed * 0.3);
            this.hill1.scroll(-INME.Vars.speed * 0.5);
            this.hill2.scroll(-INME.Vars.speed);
        },
    }

    function ParallaxSprite(game, key, x, y) {
        this.imageWidth = game.cache.getImage(key).width;

        this.group = game.add.group();
        this.group.create(0, 0, key);
        this.group.create(this.imageWidth, 0, key);
        this.group.position.set(x, y);
    }
    ParallaxSprite.prototype.scroll = function (speed) {
        this.group.position.x += speed;
        if (this.group.position.x <= -this.imageWidth) {
            this.group.position.x = 0;
        }
    }

    /**
     * 主入口
     */
    var game = new Phaser.Game(960, 540, Phaser.AUTO, '', INME.State.Boot);
    for (var key in INME.State.Key) {
        var state = INME.State[key];
        game.state.add(key, state);
    }
})();