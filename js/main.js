(function () {
    var jumpTimer = 0;
    var difficultyEasy = 8;
    /**
     * state - InGame
     * 使用内置的tileSprite配合tilePosition属性制作背景视差滚动时,个别手机浏览器会比较卡。决定自己实现
     * 
     */
    //inGame variables
    var scoreText;
    INME.State.InGame = {
        create: function () {
            this.count = 0;
            this.score = 0;
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
            this.player.animations.add('loop', [0, 1, 2, 3, 4, 5, 6, 7, 8], 10, true);
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
            //score       
            scoreText = this.game.add.text(game.world.width - 160, 16, 'score: 0', { font: "20px Arial", fill: '#000' });
        },
        update: function () {
            this.scrollBg();
            // check if player is touching ground
            //game.physics.arcade.collide(this.player, this.platform);
            var collide = game.physics.arcade.collide(this.player, this.platform);
            console.log(collide);
            //restarts game if touching obstacles
            game.physics.arcade.collide(this.obstacle, this.player, this.endGame, null, this);
            // collect packets when overlap
            game.physics.arcade.overlap(this.player, this.packet, this.collectPacket, null, this);
            // Jump when player is touching ground AND pressing spaceBar, upArrow, or tapping on mobile
            if ((upArrow.isDown || spaceBar.isDown || this.game.input.pointer1.isDown) && collide) {
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
        endGame: function () {
            INME.Sound.bg.stop();

            this.game.state.start(INME.State.Key.OverGame);
            // game.state.start('overGame');
        },
        endGameAnimation: function () {
            this.player.play('loop');
        },
        collectPacket: function (player, packet) {
            // Removes the star from the screen
            packet.kill();
            //  Add and update the score
            this.score += 1;
            scoreText.text = 'score: ' + this.score;
            console.log(scoreText.text);
        }
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

    document.addEventListener('contextmenu', function (e) {//禁止长按右键或屏幕弹出弹出框
        e.preventDefault();
    });

    window.addEventListener('resize', resizeHandler, false);
    function resizeHandler() {
        console.log(window.innerWidth, window.innerHeight);
    }

})();