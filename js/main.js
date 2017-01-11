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
    
    var playerX = 100;

    var obstacleNum = 7;
    var debug = false;
    var Type = {
        Player: 'Player',
        Obstacle: 'Obstacle',
        RedPacket: 'RedPacket',
        Ground: 'Ground',
    }
    /**
     * state - InGame
     **/
    INME.State.InGame = {
        create: function () {
            this.boomArr = [];
            this.score = 0;
            isDead = false;
            playerCollideGround = true;
            //背景音乐
            INME.Sound.bg.play();
            //物理引擎，需要多边形碰撞所以从Arcade切换成了P2
            this.game.physics.startSystem(Phaser.Physics.P2JS);
            this.game.physics.p2.gravity.y = playerGravity;
            this.game.physics.p2.setImpactEvents(true);//开启碰撞时回调函数派发
            this.game.physics.p2.setPostBroadphaseCallback(this.overlap, this);//借此模拟player和红包的overlap
            //背景
            this.game.add.image(0, 0, 'bg_ingame');
            this.cloud1 = new ParallaxSprite(this.game, 'cloud1');
            this.hill = new ParallaxSprite(this.game, 'hill');
            this.city = new ParallaxSprite(this.game, 'city');
            this.cloud2 = new ParallaxSprite(this.game, 'cloud2');
            //玩家
            this.makePlayer();
            //地面
            this.makeGround();
            //障碍物
            this.obstacle = this.game.physics.p2.createCollisionGroup();
            this.makeObstacle();
            //红包
            this.packet = this.game.physics.p2.createCollisionGroup();
            this.makeRedPacket();
            //分数      
            this.scoreBoard = this.add.bitmapText(game.world.width - 140, 16, INME.Vars.copyFontname, INME.getCopy('score') + '0', 25);
            //控制键
            spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            upArrow = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            //player的碰撞
            this.player.body.collides(this.ground, this.playerCollideGround, this);
            this.player.body.collides(this.obstacle, this.endGame, this);
            //this.player.body.collides(this.packet, this.collectPacket, this);

        },
        overlap: function (body1, body2) {
            var sprite1Name = body1.sprite.name;
            var sprite2Name = body2.sprite.name;
            if (sprite1Name === 'redPacket' && sprite2Name === 'player') {
                console.log('player-redPacket', sprite1Name, sprite2Name);
                this.collectPacket(body2, body1);
                return false;
            }
            else if (sprite1Name === 'player' && sprite2Name === 'redPacket') {
                console.log('player-redPacket', sprite1Name, sprite2Name);
                this.collectPacket(body1, body2);
                return false;
            }
            return true;
        },
        update: function () {
            this.scrollBg();
            //跳            
            var pressUp = upArrow.isDown || spaceBar.isDown || this.game.input.pointer1.isDown;
            if (pressUp && playerCollideGround) {
                playerCollideGround = false;
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
                this.player.play('up');
            }
            if (this.player.deltaY > 0) {//落下---仅通过此项检测目前并不完美                
                this.player.play('down');
            }
            if (isDead) {//挂掉        
                this.player.play('dead');
            }
            if (this.boomArr.length !== 0 && (this.boomArr[0].x <= playerX)) {
                console.log(this.boomArr);
                this.boomArr[0].destroy();
                this.boomArr.shift();
                this.boomEffect(); 
            } 
        },
        scrollBg: function () {
            this.cloud1.scroll(speed * 0.005);
            this.cloud2.scroll(speed * 0.005);
            this.hill.scroll(speed * 0.008);
            this.city.scroll(speed * 0.01);
        },
        //设置地面
        makeGround: function () {
            this.ground = this.game.physics.p2.createCollisionGroup();

            var g = this.game.add.sprite(this.game.width * 0.5, game.world.height - groundH * 0.5, 'ground');
            g.name = 'ground';
            this.game.physics.p2.enable(g, debug);

            g.body.setCollisionGroup(this.ground);
            g.body.kinematic = true;
            g.body.collides(this.playerCG);//地面碰撞player的回调函数不需要重复定义
        },
        //设置player
        makePlayer: function () {
            var prefix = 'characters/chicken_' + INME.Vars.characterIndex + '/';
            
            var frameRate = 10;

            this.playerCG = this.game.physics.p2.createCollisionGroup();

            var player = this.game.add.sprite(0, 0, 'images', prefix + '5');
            player.name = 'player';
            player.position.set(playerX, this.game.height - groundH - player.height * 0.5);

            player.animations.add('run', Phaser.Animation.generateFrameNames(prefix, 0, 2), frameRate, true);
            player.animations.add('up', Phaser.Animation.generateFrameNames(prefix, 3, 3), frameRate, true);
            player.animations.add('down', Phaser.Animation.generateFrameNames(prefix, 4, 4), frameRate, false);
            player.animations.add('dead', Phaser.Animation.generateFrameNames(prefix, 5, 5), frameRate, true);
            player.play('run');


            this.game.physics.p2.enable(player, debug);
            player.body.clearShapes();
            player.body.addRectangle(player.width * 0.8, player.height, 0, 0);
            player.body.setCollisionGroup(this.playerCG);
            player.body.fixedRotation = true

            //player.body.collideWorldBounds = true;
            this.player = player;

        },
        playerCollideGround: function () {
            playerCollideGround = true;
        },
        //产生障碍物
        makeObstacle: function () {
            var i = Math.random() * obstacleNum | 0;
            var obstacleId = 'obstacle_' + i;
            var key = 'obstacles/' + obstacleId;
            var block = this.game.add.sprite(0, 0, 'images', key);
            block.name = obstacleId;
            block.position.set(this.game.width + block.width * 0.5, this.game.height - groundH - block.height * 0.5);

            block.checkWorldBounds = true;
            block.outOfBoundsKill = true;

            this.game.physics.p2.enable(block, debug);
            block.body.clearShapes();//清除默认的矩形碰撞
            block.body.loadPolygon("physics", obstacleId);

            block.body.setCollisionGroup(this.obstacle);
            block.body.kinematic = true;
            block.body.collides(this.playerCG);//障碍物碰撞player的回调函数不需要重复定义
            block.body.velocity.x = speed;
            //check for boom
            if( key === 'obstacles/obstacle_4') {
                this.boomArr.push(block);
            }

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeObstacle, this);
        },
        //产生红包
        makeRedPacket: function () {
            var redPacket = this.game.add.sprite(0, 0, 'images', 'redPacket/012');
            redPacket.position.set(this.game.width, 289);
            redPacket.scale.set(0.35, 0.35);
            redPacket.animations.add('spin', Phaser.Animation.generateFrameNames('redPacket/', 1, 12, '', 3), 10, true);
            redPacket.name = 'redPacket';
            redPacket.play('spin');

            redPacket.checkWorldBounds = true;
            redPacket.outOfBoundsKill = true;

            this.game.physics.p2.enable(redPacket, debug);
            redPacket.body.setCollisionGroup(this.packet);
            redPacket.body.kinematic = true;
            //redPacket.body.collides(this.playerCG);//红包碰撞player的回调函数不需要重复定义
            redPacket.body.velocity.x = speed;

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeRedPacket, this);
        },
        //收集红包
        collectPacket: function (playerBody, packetBody) {//player碰撞红包时，可能存在多个碰撞点碰撞，所以回调函数可能触发多次
            //console.log(playerBody.sprite.name, packetBody.sprite.name);
            if (packetBody.hasCollided === undefined) {
                var packet = packetBody.sprite;
                packetBody.destroy();
                packet.kill();//packet.destory()无法调用？

                this.score += 1;
                this.scoreBoard.text = INME.getCopy('score') + this.score;
                INME.Vars.score = this.score;

                this.levelChange();

                packetBody.hasCollided = true;
            }

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
        endGame: function (playerBody, obstacleBody) {
            //console.log('gameover', playerBody.sprite.name, obstacleBody.sprite.name);
            if (obstacleBody.hasCollided == undefined) {
                isDead = true;
                this.game.paused = true;
                setTimeout(function () {
                    this.game.paused = false;
                    this.game.state.start(INME.State.Key.OverGame);
                }.bind(this), 1000)

                obstacleBody.hasCollided = true;
            }
        },
        killElement: function(element) {
            element.destroy();
        },
        boomEffect: function() {
            var boom = game.add.sprite(playerX, this.game.height - groundH - this.player.height, 'images', 'boom/0');
            //boom.scale.setTo(0.35, 0.35);
            boom.animations.add('boomshakalaka', Phaser.Animation.generateFrameNames('boom/', 1, 7,'',1), 10, true);
            boom.play('boomshakalaka');

            boom.checkWorldBounds = true;
            boom.outOfBoundsKill = true;
            this.game.physics.p2.enable(boom);
            boom.body.kinematic = true;
            boom.body.velocity.x = speed;
        }
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