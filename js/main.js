(function () {
    var difficulty = {//按照分数划分难度等级,不同难度对应不同速度
        scores: [25, 50, 75, 100, 150],
        speeds: [-300, -325, -350, -400, -450]
    }
    var debug = false;
    var playerX = 100;
    var groundH = 60;
    var playerVelocity = -550;
    var worldGravity = 2000;

    var Type = {
        Player: 'Player',
        Obstacle: 'Obstacle',
        RedPacket: 'RedPacket',
        Ground: 'Ground',
    }
    var ObstacleType = {
        Dead: 'Dead',
        MinusScore: 'MinusScore',
    }
    var obstacleVars = [
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'ground',
        },
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'ground',
        },
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'ground',
        },
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'sky',
        },
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'sky',
            'animations': {
                'miss': {
                    'prefix': 'boom/',
                    'start': 0,
                    'stop': 7,
                    'frameRate': 10,
                    'loop': false
                }
            }
        },
        {
            'obstacleType': ObstacleType.MinusScore,
            'position': 'ground',
        },
        {
            'obstacleType': ObstacleType.MinusScore,
            'position': 'ground',
        },
    ]

    /**
     * state - InGame
     **/
    INME.State.InGame = {
        create: function () {
            score = 0;
            isDead = false;
            playerCollideGround = true;
            speed = difficulty.speeds[0];
            //背景音乐
            INME.Sound.bg.play();
            //物理引擎，需要多边形碰撞所以从Arcade切换成了P2
            this.game.physics.startSystem(Phaser.Physics.P2JS);
            this.game.physics.p2.gravity.y = worldGravity;
            this.game.physics.p2.setImpactEvents(true);//开启碰撞时回调函数派发
            this.game.physics.p2.setPostBroadphaseCallback(this.overlap, this);//借此模拟overlap
            //背景
            this.game.add.image(0, 0, 'images', 'ingame/bg');
            this.cloud = new ParallaxSprite(this.game, 'images', 'ingame/cloud');
            this.hill = new ParallaxSprite(this.game, 'images', 'ingame/hill');
            this.city = new ParallaxSprite(this.game, 'images', 'ingame/city');
            //玩家
            this.makePlayer();
            //地面
            this.makeGround();
            //障碍物
            this.obstacleCG = this.game.physics.p2.createCollisionGroup();
            this.makeObstacle();
            //红包
            this.makeRedPacket();
            //分数条
            this.makeScoreBoard();
            //控制键
            spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            upArrow = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            //player的碰撞
            this.player.body.collides(this.groundCG, this.playerCollideGround, this);
            this.player.body.collides(this.obstacleCG, this.endGame, this);
        },
        overlap: function (body1, body2) {
            var type1 = body1.sprite.type;
            var type2 = body2.sprite.type;
            //player与红包
            if (type1 === Type.RedPacket && type2 === Type.Player) {
                this.collectPacket(body2, body1);
                return false;
            }
            else if (type1 === Type.Player && type2 === Type.RedPacket) {
                this.collectPacket(body1, body2);
                return false;
            }
            //player与减分类型的障碍物
            if (body1.sprite.obstacleType === ObstacleType.MinusScore && type2 === Type.Player) {
                this.endGame(body2, body1);
                return false;
            }
            else if (type1 === Type.Player && body2.sprite.obstacleType === ObstacleType.MinusScore) {
                this.endGame(body1, body2);
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
            if (pressUp) {//跳起
                this.player.play('up');
            }
            if (this.player.deltaY > 0) {//落下              
                this.player.play('down');
            }
            if (isDead) {//挂掉        
                this.player.play('dead');
            }

            this.check();
        },
        //检查
        check: function () {
            this.game.world.children.forEach(function (child) {
                if (child.obstacleId === 'obstacle_4' && child.x < playerX && child.hasMiss === undefined) {//展示爆竹动画
                    child.play('miss');
                    child.body.destroy();//销毁body，避免继续移动
                    child.animations.currentAnim.onComplete.add(this.aniEndDestory, this, 0, child);

                    child.hasMiss = true;
                }

                var type = child.type;//销毁---debug为true时，world.children有额外数据             
                if (type === Type.Obstacle || type === Type.RedPacket) {
                    if (child.x < (-child.width)) {
                        child.body.destroy();
                        child.destroy();
                    }
                }
            }, this)
        },
        //背景滚动        
        scrollBg: function () {
            this.cloud.scroll(speed * 0.005);
            this.hill.scroll(speed * 0.008);
            this.city.scroll(speed * 0.01);
        },
        //分数条
        makeScoreBoard: function () {
            var right = 20;
            var top = 20;
            var scoreBoard = this.add.bitmapText(0, 0, INME.Vars.copyFontname, INME.getCopy('score') + '0', 25);
            scoreBoard.anchor.set(1, 0);
            scoreBoard.position.set(this.game.width - right, top);
            this.scoreBoard = scoreBoard;
        },
        //设置地面
        makeGround: function () {
            this.groundCG = this.game.physics.p2.createCollisionGroup();

            var g = this.game.add.sprite(this.game.width * 0.5, game.world.height - groundH * 0.5, 'ground');
            this.game.physics.p2.enable(g, debug);

            g.body.setCollisionGroup(this.groundCG);
            g.body.kinematic = true;
            g.body.collides(this.playerCG);//地面碰撞player的回调函数不需要重复定义
        },
        //设置player
        makePlayer: function () {
            this.playerCG = this.game.physics.p2.createCollisionGroup();

            var frameRate = 10;
            var prefix = 'characters/chicken_' + INME.Vars.characterIndex + '/';
            var last = this.getPlayerAniLastFrame(INME.Vars.characterIndex);

            var player = this.game.add.sprite(0, 0, 'images', prefix + '4');
            player.type = Type.Player;
            player.position.set(playerX, this.game.height - groundH - player.height * 0.5);

            player.animations.add('run', Phaser.Animation.generateFrameNames(prefix, 0, last - 3), frameRate, true);
            player.animations.add('up', Phaser.Animation.generateFrameNames(prefix, last - 2, last - 2), frameRate, false);
            player.animations.add('down', Phaser.Animation.generateFrameNames(prefix, last - 1, last - 1), frameRate, false);
            player.animations.add('dead', Phaser.Animation.generateFrameNames(prefix, last, last), frameRate, false);
            player.play('run');

            this.game.physics.p2.enable(player, debug);
            player.body.clearShapes();
            player.body.addRectangle(player.width * 0.8, player.height);//目前角色的碰撞矩形不一样？
            player.body.setCollisionGroup(this.playerCG);
            player.body.fixedRotation = true;

            this.player = player;
        },
        getPlayerAniLastFrame: function setPlayerAni(id) {
            switch (id) {
                case 0:
                    return 5;
                case 1:
                    return 6;
            }
        },
        //player与地面碰撞的回调函数
        playerCollideGround: function () {
            playerCollideGround = true;
        },
        //产生障碍物
        makeObstacle: function () {
            var len = obstacleVars.length;
            var id = Math.random() * len | 0;
            var obstacleId = 'obstacle_' + id;

            var obstacle = this.produceObstacle(id);
            this.setObstacle(obstacle, id);

            this.game.physics.p2.enable(obstacle, debug);
            obstacle.body.clearShapes();//清除默认的矩形碰撞
            obstacle.body.loadPolygon("physics", obstacleId);

            obstacle.body.setCollisionGroup(this.obstacleCG);
            obstacle.body.kinematic = true;
            obstacle.body.collides(this.playerCG);//障碍物碰撞player的回调函数不需要重复定义
            obstacle.body.velocity.x = speed;

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeObstacle, this);
        },
        produceObstacle: function (id) {
            var key = 'obstacles/obstacle_' + id;
            var obstacle = this.game.add.sprite(0, 0, 'images', key);

            var vars = obstacleVars[id];
            var animations = vars.animations;
            if (animations) {
                for (var aniName in animations) {
                    var aniVars = animations[aniName]
                    obstacle.animations.add(aniName, Phaser.Animation.generateFrameNames(aniVars.prefix, aniVars.start, aniVars.stop), aniVars.frameRate, aniVars.loop);
                }
            }

            return obstacle;
        },
        setObstacle: function (obstacle, id) {
            var vars = obstacleVars[id];
            obstacle.type = Type.Obstacle;
            obstacle.obstacleType = vars.obstacleType;
            obstacle.obstacleId = 'obstacle_' + id;

            var y = this.game.height - groundH - obstacle.height * 0.5;
            if (vars.position === 'sky')
                y = this.game.height - groundH - obstacle.height * 0.5 - 120;
            obstacle.position.set(this.game.width + obstacle.width * 0.5, y);

        },
        //产生红包
        makeRedPacket: function () {
            var y = 290;
            var redPacket = this.game.add.sprite(0, 0, 'images', 'redpacket/spin/2');
            redPacket.position.set(this.game.width, y);
            redPacket.animations.add('drop', Phaser.Animation.generateFrameNames('redpacket/drop/', 0, 15), 20, false);
            redPacket.animations.add('spin', Phaser.Animation.generateFrameNames('redpacket/spin/', 0, 11), 10, true);
            redPacket.type = Type.RedPacket;
            redPacket.play('spin');

            this.game.physics.p2.enable(redPacket, debug);
            redPacket.body.kinematic = true;
            redPacket.body.velocity.x = speed;

            this.game.time.events.add(this.rnd.between(1000, 3000), this.makeRedPacket, this);
        },
        //收集红包
        collectPacket: function (playerBody, packetBody) {//player碰撞红包时，可能存在多个碰撞点碰撞，所以回调函数可能触发多次
            if (packetBody.hasCollided === undefined) {
                var packet = packetBody.sprite;
                packetBody.destroy();//销毁body，避免继续移动
                packet.x = this.player.x;//红包动画对齐player
                packet.play('drop');
                packet.animations.currentAnim.onComplete.add(this.aniEndDestory, this, 0, packet);

                this.updateScore('add');
                this.levelChange();

                packetBody.hasCollided = true;
            }
        },
        //动画结束销毁对象
        aniEndDestory: function (obj) {
            obj.destroy();
        },
        //更新分数
        updateScore: function (method) {
            var unit = 10;
            switch (method) {
                case 'minus':
                    score -= unit;
                    break;
                default:
                    score += unit;
                    break;
            }
            if (score < 0)
                score = 0;
            this.scoreBoard.text = INME.getCopy('score') + score;
            INME.Vars.score = score;
        },
        //根据分数判断是否升级难度
        levelChange: function () {
            var len = difficulty.scores.length - 1;
            if (speed !== difficulty.speeds[len]) {//当前速度未达到最快速度
                for (var i = len; i >= 0; i--) {
                    if (score > difficulty.scores[i]) {
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
            this.game.world.children.forEach(function (child) {
                if (child.type === Type.Obstacle || child.type === Type.RedPacket) {
                    if (child.body)
                        child.body.velocity.x = speed;
                }
            });
        },
        //游戏结束
        endGame: function (playerBody, obstacleBody) {
            if (obstacleBody.hasCollided == undefined) {
                if (obstacleBody.sprite.obstacleType === ObstacleType.MinusScore) {
                    this.updateScore('minus');
                }
                else {
                    isDead = true;
                    this.game.paused = true;
                    this.player.play('dead');
                    setTimeout(function () {
                        this.game.paused = false;
                        this.game.state.start(INME.State.Key.OverGame);
                    }.bind(this), 1000);
                }
                obstacleBody.hasCollided = true;
            }
        }
    }

    function ParallaxSprite(game, key, frame, x, y) {
        x = x === undefined ? 0 : x;
        y = y === undefined ? 0 : y;

        this.group = game.add.group();
        var sp = this.group.create(0, 0, key, frame);
        var imageWidth = sp.width;
        this.group.create(imageWidth, 0, key, frame);
        this.group.position.set(x, y);

        this.imageWidth = imageWidth;
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