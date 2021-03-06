(function () {
    var needShowHelp = true;//是否应该显示帮助页面

    var difficulty = {//按照分数划分难度等级,不同难度对应不同速度
        scores: [25, 70, 125, 200, 250],
        speeds: [-300, -325, -350, -400, -450]
    }
    var debug = false;
    var playerX = 100;
    var groundH = 60;
    var playerVelocity = -700;
    var worldGravity = 2000;

    var spawnX = 1100;
    var spawnDisVar = {//可以spawn的距离范围
        min: 350,
        max: 450,
    }
    var packetYArr = [//红包y轴位置的可取值
        290,
        325
    ]
    var obstacleSkyYArr = [//空中障碍物y轴位置的可取值
        280,
        300,
    ]
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
            'speedY': -15,
            'y': 410,//优先级最高
        },
        {
            'obstacleType': ObstacleType.Dead,
            'position': 'sky',
            'animations': {
                'miss': {//障碍物与player擦肩而过时播放的动画
                    'prefix': 'obstacle_4/boom/',
                    'start': 0,
                    'stop': 7,
                    'frameRate': 20,
                    'loop': false,
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
            'makePlayerIn': true,//是否让player掉入obstacle
            'animations': {
                'idle': {//障碍物的默认动画
                    'prefix': 'obstacle_7/idle/',
                    'start': 0,
                    'stop': 15,
                    'frameRate': 20,
                    'loop': true,
                },
                'show': {//纯展示性动画
                    'prefix': 'obstacle_7/fishjump/',
                    'start': 0,
                    'stop': 15,
                    'frameRate': 20,
                    'loop': false,
                    'aniType': 'coexist',//aniType指示该动画和障碍物主体之间的关系：可选值为coexist（共存）和默认值exclusive（排他
                    'y': -120,//动画中心点相对于障碍物中心点y轴位置
                }
            }

        }
    ]
    INME.State.InGame = {
        create: function () {
            jumpCount = 2;
            score = 0;
            isDead = false;
            playerCollideGround = true;
            speed = difficulty.speeds[0];

            nearestObj = null;
            spawnDis = spawnDisVar.min;
            //物理引擎，需要多边形碰撞所以从Arcade切换成了P2
            this.game.physics.startSystem(Phaser.Physics.P2JS);
            this.game.physics.p2.gravity.y = worldGravity;
            this.game.physics.p2.setImpactEvents(true);//开启碰撞时回调函数派发
            this.game.physics.p2.setPostBroadphaseCallback(this.overlap, this);//借此模拟overlap
            //背景音乐
            if (!INME.Sound.bg.isPlaying)
                INME.Sound.bg.play();
            //背景
            this.game.add.image(0, 0, 'images', 'ingame/bg');
            this.cloud = new ParallaxSprite(this.game, 'images', 'ingame/cloud');
            this.hill = new ParallaxSprite(this.game, 'images', 'ingame/hill');
            this.city = new ParallaxSprite(this.game, 'images', 'ingame/city');
            //碰撞组
            this.playerCG = this.game.physics.p2.createCollisionGroup();
            this.obstacleCG = this.game.physics.p2.createCollisionGroup();
            this.groundCG = this.game.physics.p2.createCollisionGroup();
            //地面
            this.makeGround();
            //玩家
            this.makePlayer();
            //分数条
            this.makeScoreBoard();
            this.makeTopBoard();
            //控制键
            this.game.input.keyboard.addCallbacks(this, this.handleKeyboard);
            this.game.input.onDown.add(this.handleInput, this);
            //player的碰撞
            this.player.body.collides(this.groundCG, this.playerCollideGround, this);
            this.player.body.collides(this.obstacleCG, this.playerCollideObstacle, this);
            //尝试是否显示帮助页面
            this.showHelp();
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
                this.spawn();

                this.updatePlayerDownAni();

                this.check();

                this.scrollBg();
            }
        },
        //产生障碍物和红包
        spawn: function () {
            if (nearestObj === null) {
                this.spawnObj();
            }
            else {
                if ((spawnX - nearestObj.x) > spawnDis) {
                    this.spawnObj();
                }
            }
        },
        spawnObj: function () {
            spawnDis = Phaser.Math.between(spawnDisVar.min, spawnDisVar.max);

            var id = (Math.random() * obstacleVars.length) | 0;
            if (obstacleVars[id].position === 'sky') {//障碍物在空中时,将红包移到右侧
                this.makeRedPacket(spawnDis * 0.5);
            }
            else {
                this.makeRedPacket();
            }

            nearestObj = this.makeObstacle(id);
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
                this.checkPlayAni(child.x < playerX, child, 'miss');//尝试播放miss动画
                this.checkPlayAni(child.x < (this.game.width * 0.6), child, 'show');//尝试播放show动画

                var type = child.type;//销毁---debug为true时，world.children有额外数据             
                if (type === Type.Obstacle || type === Type.RedPacket) {
                    if (child.x < (-child.width)) {
                        child.body.destroy();
                        child.destroy();
                    }
                }
            }, this)
        },
        checkPlayAni: function (condition, sprite, aniName) {
            if (condition && sprite[aniName] === undefined) {
                var aniSprite = sprite.children[0];
                if (sprite.animations && sprite.animations.getAnimation(aniName)) {
                    aniSprite = sprite;
                    this.playAni(sprite, aniSprite, aniName);
                }
                else if (aniSprite && aniSprite.animations && aniSprite.animations.getAnimation(aniName)) {
                    this.playAni(sprite, aniSprite, aniName, 'coexist');
                }
            }
        },
        playAni: function (sprite, aniSprite, aniName, aniType) {
            if (aniType !== 'coexist') {
                aniSprite.body.destroy();//销毁body，避免继续移动
            }

            aniSprite.alpha = 1;
            aniSprite.play(aniName);
            sprite[aniName] = true;
            aniSprite.animations.currentAnim.onComplete.add(this.destoryObj, this, 0, sprite);

        },
        //背景滚动        
        scrollBg: function () {
            this.cloud.scroll(speed * 0.005);
            this.hill.scroll(speed * 0.008);
            this.city.scroll(speed * 0.01);
        },
        //分数条
        makeScoreBoard: function () {
            var prefix = 'ingame/chicken_' + INME.Vars.characterIndex;
            var characterImg = {
                key: 'images',
                frame: prefix,
            }
            var nameImg = {
                key: 'images',
                frame: INME.getFrameByLan(prefix + '_name')
            }
            var position = {
                anchorX: 1,
                anchorY: 1,
                x: this.game.width - 70,
                y: 100
            }
            this.scoreBoard = new ScoreBoard(this.game, characterImg, nameImg, position)
        },
        makeTopBoard: function () {
            var img = {
                key: 'images',
                frame: 'ingame/topestIcon'
            }
            var position = {
                anchorX: 0,
                anchorY: 1,
                x: 20,
                y: 90,
            }
            new TopBoard(this.game, img, position);
        },
        //设置地面
        makeGround: function () {
            var g = this.game.add.sprite(this.game.width * 0.5, game.world.height - groundH * 0.5, 'images', 'ingame/platform');
            this.game.physics.p2.enable(g, debug);

            g.body.setCollisionGroup(this.groundCG);
            g.body.kinematic = true;
            g.body.collides(this.playerCG);//地面碰撞player的回调函数不需要重复定义
        },
        //设置player
        makePlayer: function () {
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
            player.body.addRectangle(player.width * 0.7, player.height);
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
        makeObstacle: function (id) {
            var obstacle = this.produceObstacle(id);
            this.setObstacle(obstacle, id);

            return obstacle;
        },
        produceObstacle: function (id) {
            var key = 'obstacles/obstacle_' + id;
            var obstacle = this.game.add.sprite(0, 0, 'images', key);

            var vars = obstacleVars[id];
            var animations = vars.animations;
            if (animations) {
                for (var aniName in animations) {
                    var aniVars = animations[aniName];
                    var aniSprite;
                    if (aniVars.aniType === 'coexist') {//期望播放该动画时，障碍物同时存在      
                        var len = obstacle.children.length;
                        if (len === 0) {
                            var aniSprite = this.game.add.image(0, 0, 'images', aniVars.prefix + '0')//直接再添加一个sprite不可以？
                            obstacle.addChild(aniSprite);
                            aniSprite.alpha = 0;

                            aniSprite.position.set(-obstacle.width * 0.5, aniVars.y);
                        }
                        else {
                            aniSprite = obstacle.getChildAt(0);
                        }
                    }
                    else {
                        aniSprite = obstacle;
                    }
                    aniSprite.animations.add(aniName, Phaser.Animation.generateFrameNames(aniVars.prefix, aniVars.start, aniVars.stop), aniVars.frameRate, aniVars.loop);


                    if (aniName === 'idle') {//播放默认动画
                        aniSprite.play(aniName);
                    }
                }
            }

            return obstacle;
        },
        setObstacle: function (obstacle, id) {
            var vars = obstacleVars[id];
            obstacle.type = Type.Obstacle;
            obstacle.obstacleType = vars.obstacleType;
            obstacle.makePlayerIn = vars.makePlayerIn;
            //常规设置
            var y;
            switch (vars.position) {
                case 'sky':
                    var iy = (Math.random() * obstacleSkyYArr.length) | 0;
                    y = obstacleSkyYArr[iy];
                    break;
                case 'ground':
                    y = this.game.height - groundH - obstacle.height * 0.5;
                    break;
                case 'bottom':
                    y = this.game.height - groundH + obstacle.height * 0.5;
                    break;
            }
            if (vars.y)
                y = vars.y;
            obstacle.position.set(spawnX, y);

            //body设置
            this.game.physics.p2.enable(obstacle, debug);
            obstacle.body.clearShapes();//清除默认的碰撞矩形
            obstacle.body.loadPolygon("physics", 'obstacle_' + id);

            obstacle.body.setCollisionGroup(this.obstacleCG);
            obstacle.body.kinematic = true;
            obstacle.body.collides(this.playerCG);//障碍物碰撞player的回调函数不需要重复定义
            obstacle.body.velocity.x = speed;
            if (vars.speedY) {
                obstacle.body.velocity.y = vars.speedY;
            }
        },
        //产生红包
        //xOffsetSpawn:红包x轴位置距spawnX的差值
        makeRedPacket: function (xOffsetSpawn) {
            var redPacket = this.game.add.sprite(0, 0, 'images', 'redpacket/spin/2');

            var iy = (Math.random() * packetYArr.length) | 0;
            var y = packetYArr[iy];

            if (xOffsetSpawn === undefined) {
                if (Math.random() > 0.5)
                    xOffsetSpawn = 0;
                else
                    xOffsetSpawn = spawnDis * 0.5;
            }
            x = spawnX + xOffsetSpawn;

            redPacket.position.set(x, y);
            redPacket.animations.add('drop', Phaser.Animation.generateFrameNames('redpacket/drop/', 0, 15), 20, false);
            redPacket.animations.add('spin', Phaser.Animation.generateFrameNames('redpacket/spin/', 0, 11), 10, true);
            redPacket.type = Type.RedPacket;
            redPacket.play('spin');

            this.game.physics.p2.enable(redPacket, debug);
            redPacket.body.kinematic = true;
            redPacket.body.velocity.x = speed;
        },
        //收集红包
        collectPacket: function (playerBody, packetBody) {//player碰撞红包时，可能存在多个碰撞点碰撞，所以回调函数可能触发多次
            if (packetBody.hasCollided === undefined) {
                var packet = packetBody.sprite;
                INME.Sound.getpacket.play();
                packetBody.destroy();//销毁body，避免继续移动
                packet.x = this.player.x;//红包动画对齐player
                this.game.world.bringToTop(this.player);//将player放在最前
                packet.play('drop');
                packet.animations.currentAnim.onComplete.add(this.destoryObj, this, 0, packet);

                this.updateScore('add');
                this.levelChange();

                packetBody.hasCollided = true;
            }
        },
        //销毁对象
        destoryObj: function (obj) {
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
            this.scoreBoard.updateScore(score);
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
        //处理控制键和触摸
        handleKeyboard: function (e) {
            switch (e.keyCode) {
                case 32:
                case 38:
                    if (needShowHelp) {
                        this.closeHelp();
                        needShowHelp = false;
                    }
                    else
                        this.jump();
                    break;
            }
        },
        handleInput: function () {
            if (needShowHelp) {
                this.closeHelp();
                needShowHelp = false;
            }
            else
                this.jump();
        },
        //跳跃
        jump: function () {
            if (!isDead) {
                if (jumpCount > 0) {
                    playerCollideGround = false;
                    this.player.play('up');
                    this.player.body.velocity.y = playerVelocity;
                    jumpCount--;
                }
            }

        },
        //player与障碍物碰撞
        playerCollideObstacle: function (playerBody, obstacleBody) {
            if (obstacleBody.hasCollided == undefined) {
                var obstacle = obstacleBody.sprite;
                if (obstacle.obstacleType === ObstacleType.MinusScore) {
                    this.updateScore('minus');
                }
                else {
                    this.game.world.bringToTop(this.player);//将player放在最前  
                    this.checkPlayAni(true, obstacle, 'miss');//obstacle_4的miss动画同时作为碰撞动画播放                                      
                    this.makePlayerIn(obstacle);
                    this.gameOver();
                }
                obstacleBody.hasCollided = true;
            }
        },
        gameOver: function () {//手动让游戏暂停会停掉所有的声音，为了播放gameover音效，决定不用游戏暂停模拟gameover
            isDead = true;
            this.player.play('dead');
            INME.Sound.bg.stop();
            INME.Sound.dead.play();
            INME.Vars.score = score;//更新分数

            this.game.world.children.forEach(function (child) {//销毁所有对象的body,停掉所有动画(正在播放的播放结束再停掉)
                if (child.animations && child.animations.currentAnim) {
                    child.animations.currentAnim.onComplete.add(function () {
                        child.animations.stop();
                    });
                    child.animations.currentAnim.onLoop.add(function () {
                        child.animations.stop();
                    })
                }
                if (child.body)
                    child.body.destroy();
            });

            OverGame.init(this.game);
        },
        makePlayerIn: function (obstacle) {
            if (obstacle.makePlayerIn) {
                this.player.y = obstacle.y - 30;
            }
        },
        //帮助页面
        closeHelp: function () {
            isDead = false;//用isDead模拟暂停，因为游戏一旦暂停，tween也被暂停
            needShowHelp = false;
            this.helpPage.show(false);
        },
        showHelp: function () {
            if (INME.cookie.get("once") === undefined) {

                this.helpPage = new HelpPage(this.game);

                INME.cookie.set("once", true, new Date(2020, 0, 1));

                isDead = true;
                needShowHelp = true;
            }
            else {
                isDead = false;
                needShowHelp = false;
            }
        },
    }

    function HelpPage(game) {
        this.game = game;

        var group = this.game.add.group();

        //背景
        var g = new Phaser.Graphics(this.game, 0, 0);
        g.clear();
        g.beginFill(0x000000, 0.7);
        g.drawRect(0, 0, this.game.width, this.game.height);
        g.endFill();
        group.add(g);
        //title
        var title = group.add(new Phaser.Image(game, 0, 0, 'images2', INME.getFrameByLan('intro/title')));
        title.position.set((this.game.width - title.width) * 0.5, 53);
        //条目
        this.img1 = group.add(new Phaser.Image(game, 41, 115, 'images2', INME.getFrameByLan('intro/img1')));
        this.img2 = group.add(new Phaser.Image(game, 42, 235, 'images2', INME.getFrameByLan('intro/img2')));
        this.img3 = group.add(new Phaser.Image(game, 42, 343, 'images2', INME.getFrameByLan('intro/img3')));
        this.img1.alpha = 0;
        this.img2.alpha = 0;
        this.img3.alpha = 0;
        //按钮
        var btn = new INME.Button2(game, null, this, 'images2', 'intro/btnBg', 'intro/btnBg', INME.getFrameByLan('intro/tap'));
        btn.position.set(this.game.width * 0.5, 485);
        btn.alpha = 0;
        this.btn = btn;
        group.add(btn);

        this.group = group;
        this.show(true);
    }
    HelpPage.prototype.show = function (tweeIn) {
        if (tweeIn) {
            this.game.add.tween(this.img1).to({ alpha: 1 }, 500, null, true, 0);
            this.game.add.tween(this.img2).to({ alpha: 1 }, 500, null, true, 500);
            this.game.add.tween(this.img3).to({ alpha: 1 }, 500, null, true, 1000);
            this.game.add.tween(this.btn).to({ alpha: 1 }, 500, null, true, 1500);
        }
        else {
            var tween = this.game.add.tween(this.group).to({ alpha: 0 }, 500, null, true, 0);
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

    function ScoreBoard(game, characterImg, nameImg, position) {
        var group = game.add.group();

        var character = group.addChild(new Phaser.Image(game, 0, 0, characterImg.key, characterImg.frame));
        var name = group.addChild(new Phaser.Image(game, 0, 0, nameImg.key, nameImg.frame));
        name.position.set(character.width, character.height - name.height);

        var scoreBT = group.addChild(new Phaser.BitmapText(game, 0, 0, INME.Vars.copyFontname, '0', 36));
        scoreBT.position.set(character.width + 5, character.height * 0.5 - scoreBT.height * 0.5);

        this.scoreBT = scoreBT;
        this.group = group;
        this.position = position;

        this.setPosition();
    }

    ScoreBoard.prototype.updateScore = function (value) {
        this.scoreBT.text = value;
    }
    ScoreBoard.prototype.setPosition = setPosition;

    function TopBoard(game, img, position) {
        var group = game.add.group();

        var img = group.addChild(new Phaser.Image(game, 0, 0, img.key, img.frame));

        var scoreBT = group.addChild(new Phaser.BitmapText(game, 0, 0, INME.Vars.copyFontname, '0', 36));
        scoreBT.position.set(img.width + 5, img.height * 0.5 - scoreBT.height * 0.5);

        this.group = group;
        this.position = position;
        this.scoreBT = scoreBT;
        this.setPosition();
        this.getTopestScore();
    }
    TopBoard.prototype.getTopestScore = function () {
        INME.ajax('GET', '../server/score.php', null, getTop10.bind(this));

        function getTop10(data) {
            var players = data['scorelist'];
            var len = players.length;
            if (len > 0) {
                var topestscore = players[0].score;
                this.scoreBT.text = topestscore;
                this.setPosition();
                console.log('获取最高分数成功,main', topestscore);
            }
            //获得此时第10名的分数，并更新INME.Vars.tenthScore
            var lastIndex = len - 1;
            if (lastIndex > -1) {
                INME.Vars.tenthScore = players[lastIndex].score;
                console.log('获取第10名的分数成功,main', INME.Vars.tenthScore);
            }
        }
    }
    TopBoard.prototype.setPosition = setPosition;

    function setPosition() {
        var anchorX = this.position.anchorX === undefined ? 0.5 : this.position.anchorX;
        var anchorY = this.position.anchorY === undefined ? 0.5 : this.position.anchorY;
        var x = this.position.x - anchorX * this.group.width;
        var y = this.position.y - anchorY * this.group.height;
        this.group.position.set(x, y);
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
    }


})();