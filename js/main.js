(function () {
    var difficulty = {//按照分数划分难度等级,不同难度对应不同速度
        scores: [25, 50, 75, 100, 150],
        speeds: [-300, -325, -350, -400, -450]
    }
    var debug = false;
    var playerX = 100;
    var skyY = 250;
    var spawnX = 1100;
    var spawnDis = 200;
    var groundH = 60;
    var playerVelocity = -650;
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
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'bottom',
        },
    ]

    /**
     * state - InGame
     **/
    INME.State.InGame = {
        create: function () {
            jumpCount = 2;
            score = 0;
            isDead = false;
            playerCollideGround = true;
            speed = difficulty.speeds[0];

            seed = 0;//游戏
            nearestX = spawnDis;//红包或障碍物离spawnX最近的距离
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
            this.game.input.keyboard.addCallbacks(this, this.handleKeyboard);
            this.game.input.onDown.add(this.verifyJump, this);
            //player的碰撞
            this.player.body.collides(this.groundCG, this.playerCollideGround, this);
            this.player.body.collides(this.obstacleCG, this.playerCollideObstacle, this);
        },
        overlap: function (body1, body2) {
            if (body1.sprite === null || body2.sprite === null)
                return;

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
                this.playerCollideObstacle(body2, body1);
                return false;
            }
            else if (type1 === Type.Player && body2.sprite.obstacleType === ObstacleType.MinusScore) {
                this.playerCollideObstacle(body1, body2);
                return false;
            }

            return true;
        },
        update: function () {
            if (!isDead) {
                this.scrollBg();

                this.updatePlayerDownAni();

                this.check();

                this.spawn();
            }
        },
        //障碍物和红包的产生,
        spawn: function () {


        },

        //更新player下落的动画
        updatePlayerDownAni: function () {
            if (playerCollideGround === false && this.player.deltaY > 0) {
                this.player.play('down');
            }
        },
        //检查
        check: function () {
            this.game.world.children.forEach(function (child) {
                if (child.animations && child.animations.getAnimation('miss') && child.x < playerX && child.hasMiss === undefined) {//展示爆竹动画
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
            player.position.set(playerX, this.game.height - groundH - player.height);

            player.animations.add('run', Phaser.Animation.generateFrameNames(prefix, 0, last - 3), frameRate, true);
            player.animations.add('up', Phaser.Animation.generateFrameNames(prefix, last - 2, last - 2), frameRate, false);
            player.animations.add('down', Phaser.Animation.generateFrameNames(prefix, last - 1, last - 1), frameRate, false);
            player.animations.add('dead', Phaser.Animation.generateFrameNames(prefix, last, last), frameRate, false);
            player.play('run');

            this.game.physics.p2.enable(player, debug);
            player.body.clearShapes();
            player.body.addRectangle(player.width * 0.7, player.height);//目前角色的碰撞矩形不一样？
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
            this.player.play('run');
            jumpCount = 2;
        },
        //产生障碍物
        makeObstacle: function () {
            var len = obstacleVars.length;
            var id = Math.random() * len | 0;
            var obstacleId = 'obstacle_' + id;

            var obstacle = this.produceObstacle(id);
            this.setObstacle(obstacle, id);

            this.game.physics.p2.enable(obstacle, debug);
            obstacle.body.clearShapes();//清除默认的碰撞矩形
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

            var y;
            switch (vars.position) {
                case 'sky':
                    y = skyY;
                    break;
                case 'ground':
                    y = this.game.height - groundH - obstacle.height * 0.5;
                    break;
                case 'bottom':
                    y = this.game.height - groundH + obstacle.height * 0.5;
                    break;
            }
            obstacle.position.set(this.game.width + obstacle.width * 0.5, y);
        },
        //产生红包
        makeRedPacket: function () {
            var redPacket = this.game.add.sprite(0, 0, 'images', 'redpacket/spin/2');
            redPacket.position.set(this.game.width, skyY);
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
                INME.Sound.getpacket.play();
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
        //double jump
        verifyJump: function () {
            if (!isDead) {
                if (jumpCount > 0) {
                    playerCollideGround = false;
                    this.player.play('up');
                    this.player.body.velocity.y = playerVelocity;
                    jumpCount--;
                }
            }

        },
        handleKeyboard: function (e) {
            switch (e.keyCode) {
                case 32:
                case 38:
                    this.verifyJump();
                    break;
            }

            console.log('1111', e.keyCode);
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
        //player与障碍物碰撞
        playerCollideObstacle: function (playerBody, obstacleBody) {
            if (obstacleBody.hasCollided == undefined) {
                if (obstacleBody.sprite.obstacleType === ObstacleType.MinusScore) {
                    this.updateScore('minus');
                }
                else {
                    this.gameOver();
                }
                obstacleBody.hasCollided = true;
            }
        },
        gameOver: function () {//手动让游戏暂停会停掉所有的声音，为了播放gameover音效，暂决定不用游戏暂停模拟gameover
            isDead = true;
            this.player.play('dead');
            INME.Sound.bg.stop();
            INME.Sound.dead.play();

            this.game.world.children.forEach(function (child) {//销毁所有对象的body
                if (child.body)
                    child.body.destroy();
            });

            setTimeout(function () {
                this.game.state.start(INME.State.Key.OverGame);
            }.bind(this), 1000);
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