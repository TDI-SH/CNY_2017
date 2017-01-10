(function () {
    var scoreText;
    var difficulty = {//按照分数划分难度等级,不同难度对应不同速度
        scores: [5, 10, 30, 40, 50],
        speeds: [-220, -250, -300, -350, -450]
    }
    var speed = difficulty.speeds[0];
    var groundH = 60;
    var playerVelocity = -550;
    var playerGravity = 2000;

    var obstacleNum = 7;
    /**
     * state - InGame
     **/

    INME.State.InGame = {

        create: function () {
            this.score = 0;
            //背景音乐
            INME.Sound.bg.play();
            //物理
            game.physics.startSystem(Phaser.Physics.Arcade);
            //背景
            this.game.add.image(0, 0, 'bg_ingame');
            this.cloud1 = new ParallaxSprite(this.game, 'cloud1');
            this.hill = new ParallaxSprite(this.game, 'hill');
            this.city = new ParallaxSprite(this.game, 'city');
            this.cloud2 = new ParallaxSprite(this.game, 'cloud2');
            //地面
            this.ground = this.game.add.sprite(0, game.world.height - groundH, 'ground');
            this.game.physics.arcade.enable(this.ground);
            this.ground.body.immovable = true;
            //玩家
            this.makePlayer();
            //obstacle
            this.obstacle = game.add.group();
            this.obstacle.enableBody = true;
            this.makeObstacle();
            //red packet
            this.packet = game.add.group();
            this.packet.enableBody = true;
            this.makeRedPacket();
            //score       
            this.scoreBoard = this.add.bitmapText(game.world.width - 140, 16, INME.Vars.copyFontname, INME.getCopy('score') + '0', 25);
            //control-keys
            spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            upArrow = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        },
        update: function () {
            this.scrollBg();
            //检测player与障碍物和红包碰撞
            var playerCollideObstacle = this.game.physics.arcade.collide(this.obstacle, this.player, this.endGame, null, this);
            this.game.physics.arcade.overlap(this.player, this.packet, this.collectPacket, null, this);
            //跳
            var playerCollideGround = this.game.physics.arcade.collide(this.player, this.ground);
            var pressUp = upArrow.isDown || spaceBar.isDown || this.game.input.pointer1.isDown;

            if (pressUp && playerCollideGround) {
                this.jumpTimer = 1;
                this.player.body.velocity.y = playerVelocity;
            } else if (pressUp && (this.jumpTimer != 0)) {
                if (this.jumpTimer > 15) {
                    this.jumpTimer = 0;
                } else {
                    this.jumpTimer++;
                    this.player.body.velocity.y = playerVelocity;
                }
            }
            else if (this.jumpTimer != 0) {
                this.jumpTimer = 0;
            }
            //设置player的动画   
            if (playerCollideGround) {//跑
                this.player.play('run');
            }
            if (pressUp && playerCollideGround) {//跳起
                //console.log('up', this.player.deltaY);
                this.player.play('up');
            }
            if (this.player.deltaY > 0) {//落下---仅通过此项检测目前并不完美                
                this.player.play('down');
            }
            if (playerCollideObstacle) {//挂掉        
                this.player.play('dead');
            }

        },
        scrollBg: function () {
            this.cloud1.scroll(speed * 0.005);
            this.cloud2.scroll(speed * 0.005);
            this.hill.scroll(speed * 0.008);
            this.city.scroll(speed * 0.01);
        },
        //设置player
        makePlayer: function () {
            var prefix = 'characters/chicken_' + INME.Vars.characterIndex + '/';
            var playerX = 100;
            var frameRate = 10;

            this.player = this.game.add.sprite(0, 0, 'images', prefix + '5');
            this.player.position.set(playerX, this.game.height - groundH - this.player.height);

            this.player.animations.add('run', Phaser.Animation.generateFrameNames(prefix, 0, 2), frameRate, true);
            this.player.animations.add('up', Phaser.Animation.generateFrameNames(prefix, 3, 3), frameRate, true);
            this.player.animations.add('down', Phaser.Animation.generateFrameNames(prefix, 4, 4), frameRate, false);
            this.player.animations.add('dead', Phaser.Animation.generateFrameNames(prefix, 5, 5), frameRate, true);
            this.player.play('run');

            this.game.physics.arcade.enable(this.player);
            this.player.body.gravity.y = playerGravity;
            this.player.body.collideWorldBounds = true;
        },
        //产生障碍物
        makeObstacle: function () {
            var i = Math.random() * obstacleNum | 0;
            var key = 'obstacles/obstacle_' + i;
            var block = this.game.add.sprite(this.game.width, 0, 'images', key);
            block.position.set(this.game.width, this.game.height - block.height - groundH);

            block.checkWorldBounds = true;
            block.outOfBoundsKill = true;

            this.obstacle.add(block);
            block.body.velocity.x = speed;
            block.body.immovable = true;

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeObstacle, this);
        },
        //产生红包
        makeRedPacket: function () {
            var redPacket = game.add.sprite(900, this.game.height - 248, 'redPacket');
            redPacket.scale.setTo(0.35, 0.35);
            redPacket.animations.add('spin', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 10, true);
            redPacket.play('spin');

            redPacket.checkWorldBounds = true;
            redPacket.outOfBoundsKill = true;

            this.packet.add(redPacket);
            redPacket.body.velocity.x = speed;
            redPacket.body.immovable = true;

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeRedPacket, this);
        },
        //收集红包
        collectPacket: function (player, packet) {
            packet.kill();
            this.score += 1;

            this.scoreBoard.text = INME.getCopy('score') + this.score;
            INME.Vars.score = this.score;

            this.levelChange();
        },
        //根据分数判断是否升级难度
        levelChange: function () {
            var len = difficulty.scores.length - 1;
            if (speed !== difficulty.speeds[len]) {//当前速度未达到最快速度
                for (var i = len; i >= 0; i--) {
                    if (this.score > difficulty.scores[i]) {
                        speed = difficulty.speeds[i];
                        console.log('当前速度', speed);
                        this.speedUp();
                        break;//跳出整个循环
                    }

                }
            }
        },
        //将所有红包和障碍物的移动速度设置为新的speed
        speedUp: function () {
            this.packet.children.forEach(speedUpObj);
            this.obstacle.children.forEach(speedUpObj);

            function speedUpObj(obj) {
                obj.body.velocity.x = speed;
            }
        },
        //游戏结束
        endGame: function () {
            this.game.paused = true;
            setTimeout(function () {
                this.game.paused = false;
                this.game.state.start(INME.State.Key.OverGame);
            }.bind(this), 1000)
        },
    }

    function ParallaxSprite(game, key, x, y) {
        x = x === undefined ? 0 : x;
        y = y === undefined ? 0 : y;

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

    document.addEventListener('contextmenu', function (e) {//禁止长按右键或屏幕弹出弹出框
        e.preventDefault();
    });

    window.addEventListener('resize', resizeHandler, false);
    function resizeHandler() {
        console.log(window.innerWidth, window.innerHeight);
    }

})();