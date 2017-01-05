(function () {
    var INME = INME || {};

    var jumpTimer = 0;
    var difficultyEasy = 8;


    INME.Vars = {
        speed: 1,
        characterIndex: 0,
        characterNum: 2,
        characterPrefix: 'chicken',
        velocity: -550,
        velocityLong: -1550,
        gravity: 2000,
    }

    INME.Audio = {

    }

    INME.State = {
        Key: {
            Boot: 'Boot',
            Loading: 'Loading',
            Language: 'Language',
            Story: 'Story',
            Help: 'Help',
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
        preload: function () {
            var lb = this.game.add.sprite(0, 268, 'loadingbar');
            this.game.load.setPreloadSprite(lb);

            this.game.load.pack('common', 'assets/pack.json');
        },
        create: function () {
            //初始化音效
            INME.Sound = {
                'bg': this.game.add.audio('bg', 0.5, true),
                'collision': this.game.add.audio('collision'),
            }
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

            video.volume = 0;//－－－测试
            this.game.state.start(INME.State.Key.StartGame)
        }
    }
    INME.State.Help = {
        create: function () {
            this.game.add.button(10, 10, 'btnClose', this.handleClick, this, 1, 0, 1, 0);
            this.game.add.text(this.game.width >> 1, this.game.height >> 1, 'i am help screen', { font: 'regular 36pt Microsoft YaHei' }).anchor.set(0.5);
        },
        handleClick: function () {
            this.game.state.start(INME.State.Key.StartGame);
        }
    }
    /**
     * state - StartGame
     */
    INME.State.StartGame = {
        create: function () {
            this.game.add.button(385, 400, 'btnPlay', this.handleClick, this, 1, 0, 1, 0).name = 'btnPlay';
            this.game.add.button(870, 490, 'btnHelp', this.handleClick, this, 1, 0, 1, 0).name = 'btnHelp';
            //角色选择
            var cs = new CharacterSelector(this.game, this.getCSKeys(), this.selectCharacter, INME.Vars.characterIndex);
            cs.position.set((this.game.width - cs.width) >> 1, 100);
        },
        getCSKeys: function () {
            var arr = [];
            for (var i = 0; i < INME.Vars.characterNum; i++) {
                arr.push(INME.Vars.characterPrefix + '_' + i + '_select');
            }
            return arr;
        },
        selectCharacter: function (index) {
            INME.Vars.characterIndex = index;
        },
        handleClick: function (btn) {
            btnName = btn.name;
            switch (btnName) {
                case 'btnPlay':
                    this.game.state.start(INME.State.Key.InGame);
                    break;
                case 'btnHelp':
                    this.game.state.start(INME.State.Key.Help);
                    break;
            }
        }

    }
    function CharacterSelector(game, keys, callback, index) {
        var x = 0;
        var padding = 30;

        index = index === undefined ? 0 : index;

        var group = game.add.group();
        group.inputEnableChildren = true;
        group.onChildInputDown.add(handleClick);

        var len = keys.length;
        for (var i = 0; i < len; i++) {
            var c = group.create(x, 0, keys[i]);
            x += (c.width + padding);
        }

        setSprite(group.getChildAt(index), 1);//初始化选择

        function handleClick(sprite, pointer) {
            var wantIndex = group.getChildIndex(sprite);
            if (wantIndex !== index) {
                setSprite(sprite, 1);
                setSprite(group.getChildAt(index), 0);

                index = wantIndex;

                callback(index);
            }
        }

        function setSprite(sprite, frame) {
            sprite.frame = frame;
        }

        return group;
    }

    /**
     * state - InGame
     * 使用内置的tileSprite配合tilePosition属性制作背景视差滚动时,个别手机浏览器会比较卡。决定自己实现
     * 
     */
    INME.State.InGame = {
        create: function () {
            this.count = 0;
            //背景音乐
            INME.Sound.bg.play();
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
            //red packet
            this.packet = game.add.group();
            //玩家
            this.player = this.game.add.sprite(100, this.game.height - 248, INME.Vars.characterPrefix + '_' + INME.Vars.characterIndex);
            this.player.animations.add('run', [5, 6, 7, 8], 10, true);
            this.player.animations.add('up', [4], 10, false);
            this.player.animations.add('loop', [0,1,2,3,4,5,6,7,8], 10, true);
            this.player.play('run');
            this.game.physics.arcade.enable(this.player);
            this.player.body.gravity.y = INME.Vars.gravity;
            this.player.body.collideWorldBounds = true;
            //obstacle
            this.obstacle = game.add.group();
            this.obstacle.enableBody = true;
            //control-keys
            spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            upArrow = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            this.dupeObstacle();
            this.makeRedPacket();
        },
        update: function () {
            this.scrollBg();
            // check if player is touching ground
            game.physics.arcade.collide(this.player, this.platform);
            //restarts game if touching obstacles
            game.physics.arcade.collide(this.obstacle, this.player, this.endGame, null, this);
            // Jump when player is touching ground AND pressing spaceBar, upArrow, or tapping on mobile
            if ((upArrow.isDown || spaceBar.isDown || this.game.input.pointer1.isDown) && this.player.body.touching.down) {
                this.jumpTimer = 1;
                this.player.body.velocity.y = INME.Vars.velocity;
            } else if ((upArrow.isDown || spaceBar.isDown || this.game.input.pointer1.isDown) && (this.jumpTimer != 0)) {
                //player is no longer on the ground, but is still holding the jump key
                if (this.jumpTimer > 15) {
                    // player has been holding jump for over 15 frames, it's time to stop him
                    this.jumpTimer = 0;
                } else {
                    // player is allowed to jump higher (not yet 15 frames of jumping)
                    this.jumpTimer++;
                    this.player.body.velocity.y = INME.Vars.velocity;
                }
            }
            else if (this.jumpTimer != 0) {
                //reset this.jumpTimer since the player is no longer holding the jump key
                this.jumpTimer = 0;
            }

            //jump frame and running frame change
            if (!this.player.body.touching.down) {
                this.player.play('up');
            } else {
                this.player.play('run');
            }

        },
        scrollBg: function () {
            this.bg.scroll(-INME.Vars.speed * 0.3);
            this.hill1.scroll(-INME.Vars.speed * 0.5);
            this.hill2.scroll(-INME.Vars.speed);
        },
        //==================================================
        //===============setting up obstacles===============
        //==================================================
        makeObstacle: function (x, y) {
            this.block = game.add.sprite(x, y, 'obstacle', Math.floor(Math.random() * 5));
            this.block.scale.setTo(0.8, 0.8);
            this.obstacle.add(this.block);
            game.physics.arcade.enable(this.block);
            game.physics.arcade.enable(this.obstacle);
            this.block.body.velocity.x = -200;
            this.block.checkWorldBounds = true;
            this.block.outOfBoundsKill = true;
            // change existing blocks to be fast
            if (this.count >= difficultyEasy) {
                for (var i = difficultyEasy - 3; i < difficultyEasy + 3; i++) {
                    this.obstacle.hash[i].body.velocity.x = -300;
                }
                this.block.body.velocity.x = -300;
            }
        },
        dupeObstacle: function () {
            // Randomly pick a number between 1 and 5
            // This will be the hole position
            var height = Math.floor(Math.random() * 2) + 1;
            this.score += 1;
            // Add the 6 obstacles 
            // With one big hole at position 'hole' and 'hole + 1'
            for (var i = 1; i < height + 1; i++) {
                this.makeObstacle(960, (game.world.height - 64) - 50 * i);
            }
            this.game.time.events.add(this.rnd.between(1000, 3000), this.dupeObstacle, this);
            this.count++;
        },
        //redpacket
        makeRedPacket: function () {
            var redPacket = game.add.sprite(900, this.game.height - 248, 'redPacket');
            redPacket.animations.add('spin', [0, 1, 2, 3, 4, 5], 10, true);
            redPacket.play('spin');
            this.packet.add(redPacket);
            game.physics.arcade.enable(redPacket);
            redPacket.body.velocity.x = -200;
            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeRedPacket, this);
            redPacket.checkWorldBounds = true;
            redPacket.outOfBoundsKill = true;
        },
        //restarts game
        endGame: function() {
            INME.Sound.bg.stop();

            this.game.state.start(INME.State.Key.OverGame);
            // game.state.start('overGame');
        },
        endGameAnimation: function() {
            this.player.play('loop');
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


    // gameover
    INME.State.OverGame = {
        preload:function(){

        },
        create:function(){
            this.gameOver();
        },
        update:function(){

        },
        gameOver:function(){
            gameOverGroup = this.game.add.group();
            gameOverBg = this.add.sprite(0, 0, "msgBg");
            gameOverBg.anchor.setTo(.5, .5);
            gameOverGroup.add(gameOverBg);

            var txt = this.game.add.text(0,-80,'GAME OVER',{fontSize:'30px',fill:'#fff'});
            txt.anchor.setTo(.5,.5);
            gameOverGroup.add(txt);

            var score = this.game.add.text(0,-50,'SCORE:1000',{fontSize:'24px',fill:'#fff'});
            score.anchor.setTo(.5,.5);
            gameOverGroup.add(score);

            var play = this.game.add.button(0,-10,'playBtn',this.playAgain,this);
            play.anchor.setTo(.5,.5);
            play.scale.setTo(.7,.7);
            play.input.useHandCursor = true;
            gameOverGroup.add(play);

            var submit = this.game.add.button(-80,50,'submit',this.submitScore,this);
            submit.anchor.setTo(.5,.5);
            submit.scale.setTo(.7,.7);
            submit.input.useHandCursor = true;
            gameOverGroup.add(submit);

            var view = this.game.add.button(80,50,'viewScore',this.viewHightScore,this);
            view.anchor.setTo(.5,.5);
            view.scale.setTo(.7,.7);
            view.input.useHandCursor = true;
            gameOverGroup.add(view);



            var shareSina = this.game.add.button(-120,90,'share',function(){
                this.shareFn('sina');
            },this);
            shareSina.anchor.setTo(.5,.5);
            shareSina.scale.setTo(.7,.7);
            shareSina.frame = 0;
            shareSina.input.useHandCursor = true;
            gameOverGroup.add(shareSina);

            var shareWechat = this.game.add.button(-40,90,'share',function(){
                this.shareFn('wechat');
            },this);
            shareWechat.anchor.setTo(.5,.5);
            shareWechat.scale.setTo(.7,.7);
            shareWechat.frame = 1;
            shareWechat.input.useHandCursor = true;
            gameOverGroup.add(shareWechat);

            var shareTwitter = this.game.add.button(40,90,'share',function(){
                this.shareFn('twitter');
            },this);
            shareTwitter.anchor.setTo(.5,.5);
            shareTwitter.scale.setTo(.7,.7);
            shareTwitter.frame = 2;
            shareTwitter.input.useHandCursor = true;
            gameOverGroup.add(shareTwitter);

            var shareFace = this.game.add.button(120,90,'share',function(){
                this.shareFn('facebook');
            },this);
            shareFace.anchor.setTo(.5,.5);
            shareFace.scale.setTo(.7,.7);
            shareFace.frame = 3;
            shareFace.input.useHandCursor = true;
            gameOverGroup.add(shareFace);


            gameOverGroup.position.x = this.game.world.centerX;
            gameOverGroup.position.y = this.game.world.centerY;
            gameOverGroup.alpha = 0;
            this.game.add.tween(gameOverGroup).to({
                alpha:1
            },1000,Phaser.Easing.Bounce.Out,true,0,0,false);
        },
        playAgain:function(){
            console.log('play again');
            this.game.state.start(INME.State.Key.StartGame);
        },
        submitScore:function(){
            console.log('submit');
            // this.game.state.start('submit');
        },
        viewHightScore:function(){
            console.log('view high score');
        },
        shareFn:function(obj){
            var sinaShareURL = "http://service.weibo.com/share/share.php?";
            var qqShareURL = "http://share.v.t.qq.com/index.php?c=share&a=index&";
            var host_url = document.location;
            var title = 'share test';
            var pic = '';
            if(obj=="sina"){
                _URL=sinaShareURL+"url="+host_url+"&title="+title+"&pic="+pic;
                window.open(_URL);
            }else if(obj=="qq"){
                _URL=qqShareURL+"url="+host_url+"&title="+title+"&pic="+pic;
                window.open(_URL);
            }else if(obj=="wechat"){
                console.log('wechat');
            }else if(obj=="facebook"){
                console.log('facebook');
            }else if(obj =='twitter'){
                console.log('twitter');
            }
            
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

    document.addEventListener('contextmenu', function (e) {//禁止长按右键或屏幕弹出弹出框
        e.preventDefault();
    });

    window.addEventListener('resize', resizeHandler, false);
    function resizeHandler() {
        console.log(window.innerWidth, window.innerHeight);
    }

})();