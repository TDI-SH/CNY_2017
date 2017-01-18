(function () {
    /**
     * state - Boot
     */
    INME.State.Boot = {
        init: function () {
            this.game.stage.backgroundColor = 0x7d1024;

            this.game.scale.pageAlignHorizontally = true;
            this.game.scale.pageAlignVertically = true;
            if (this.game.device.desktop) {
                console.log('桌面');

                this.game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
            }
            else {
                console.log('手机');
                this.responsiveDom();

                this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                this.game.scale.forceOrientation(true, false);//强制为横屏
                this.game.scale.enterIncorrectOrientation.add(this.orientationHandler, this, 0, true);
                this.game.scale.leaveIncorrectOrientation.add(this.orientationHandler, this, 0, false);
            }

        },
        preload: function () {
            this.game.load.image('loadingbar', 'assets/loading/loadingbar.png');
            this.game.load.image('loadingBg', 'assets/loading/loadingBg.png');
        },
        create: function () {
            this.game.state.start(INME.State.Key.Loading);
        },
        orientationHandler: function (paused) {
            var display = paused === true ? 'block' : 'none';
            this.game.paused = paused;
            document.querySelector('.msg__landscape').style.display = display;
            document.querySelector('.msg__landscape>p').textContent = INME.getCopy('landscape');
        },
        //在手机端对dom层做响应式布局
        responsiveDom: function () {
            var container = document.querySelector('.container');
            var scaleW = window.innerWidth / this.game.width;
            var scaleH = window.innerHeight / this.game.height;
            var scale = Math.min(scaleW, scaleH);
            var value = 'translate(-50%,-50%) scale(' + scale + ',' + scale + ')';
            this.setTransfrom(container, value);
        },
        setTransfrom: function (dom, value) {
            dom.style.webkitTransform = value;
            dom.style.MozTransform = value
            dom.style.msTransform = value;
            dom.style.OTransform = value;
            dom.style.transform = value;
        }
    }
    /**
     * state - Loading
     */
    INME.State.Loading = {
        preload: function () {
            this.game.add.image(0, 0, 'loadingBg');


            var lb = this.game.add.sprite(282, 346, 'loadingbar');
            this.game.load.setPreloadSprite(lb);

            this.game.load.pack('common', 'assets/pack.json');
        },
        create: function () {
            //初始化音效
            INME.Sound = {
                'bg': this.game.add.audio('bg', 1, true),
                'getpacket': this.game.add.audio('getpacket'),
                'dead': this.game.add.audio('dead'),
            }
            this.game.state.start(INME.State.Key.Language);
        },
    }
    /**
     * state - Language
     */
    INME.State.Language = {
        create: function () {
            var lans = INME.Languages;
            var x = this.game.width >> 1;
            var padding = 100;
            var y = 150;
            for (var lan in lans) {
                var text = lans[lan];
                var btn = new INME.Button(this.game, this.handleClick, this, 'btnLan', text, 28);
                btn.name = lan;
                btn.x = x;
                btn.y = y;
                y += padding;
            }
        },
        handleClick: function (btn) {
            var lan = btn.name;
            INME.Vars.language = lan;
            this.game.state.start(INME.State.Key.Story);
        }
    }
    /**
     * state - Story
     */
    // INME.State.Story = {
    //     create: function () {
    //         var video = this.game.add.video('backstory');
    //         video.addToWorld();
    //         this.game.input.keyboard.addCallbacks(this, this.handlePress);
    //         console.log(this.game.input.keyboard.addCallbacks(this, this.handlePress));
    //         video.play();
    //         video.onComplete.addOnce(function () {
    //             console.log('backstory ended, enter game');
    //             this.game.state.start(INME.State.Key.StartGame);
    //         }, this);

    //         video.volume = 0;//－－－测试
    //         //this.game.state.start(INME.State.Key.StartGame)

    //     },

    //     handlePress: function (key) {
    //         switch(key.keyCode) {
    //             case 27:
    //                this.game.state.start(INME.State.Key.StartGame);  
    //         }
    //         console.log(key.keyCode);
    //     }
    // }

    INME.State.Story = {
        create: function () {

            this.imgs = [];
            this.num = 3;
            this.id = 0;

            this.game.add.button(10, 10, 'btnClose', this.handleClick, this, 1, 0, 1, 0).name = 'btnClose';

            var btnNext = new INME.Button(this.game, this.handleClick, this, 'btnLan', INME.getCopy('next'), 28);
            btnNext.name = 'btnNext';
            btnNext.position.set(615, 470);

            var btnPre = new INME.Button(this.game, this.handleClick, this, 'btnLan', INME.getCopy('pre'), 28);
            btnPre.name = 'btnPre';
            btnPre.position.set(345, 470);

            var x = 240;
            var y = 40;
            for (var i = 0; i < this.num; i++) {
                var img = this.game.add.image(x, y, 'helpIntro', i);
                this.imgs.push(img);
                img.alpha = 0;
            }
            this.imgs[this.id].alpha = 1;//初始化   
            this.game.input.keyboard.addCallbacks(this, this.handlePress);
        },
        handleClick: function (btn) {
            switch (btn.name) {
                case 'btnClose':
                    this.game.state.start(INME.State.Key.StartGame);
                    break;
                case 'btnNext':
                    var newId = this.id + 1;
                    if (newId >= this.num)
                        newId = this.num - 1;

                    this.switchInto(newId);
                    break;
                case 'btnPre':
                    var newId = this.id - 1;
                    if (newId < 0)
                        newId = 0;

                    this.switchInto(newId);
                    break;
            }
        },
        switchInto: function (newId) {
            if (newId !== this.id) {

                console.log(newId, this.id);

                var oldImg = this.imgs[this.id];
                var newImg = this.imgs[newId];


                newImg.alpha = 0;
                this.game.add.tween(newImg).to({ alpha: 1 }, 500, 'Linear', true);

                this.game.add.tween(oldImg).to({ alpha: 0 }, 500, 'Linear', true);

                this.id = newId;
            }
        },
        handlePress: function (key) {
            switch (key.keyCode) {
                case 27:
                    this.game.state.start(INME.State.Key.StartGame);
            }
        }
    }

    INME.State.StartGame = {
        create: function () {
            //角色选择
            new CharacterSelector(this.game, this.getCSImages(), this.getCSPositions(), this.selectCharacter, INME.Vars.characterIndex);
            //前景
            this.game.add.image(0, 310, 'images', 'startgame/greatWall');
            //标题
            var title = this.game.add.image(0, 0, 'images', INME.getFrameByLan('startgame/title'));
            title.anchor.set(0.5, 0.5);
            title.position.set(this.game.width >> 1, 100);
            //开始按钮
            var btnPlay = new INME.Button2(this.game, this.handleClick, this, 'images', 'startgame/btnOver', 'startgame/btn', INME.getFrameByLan('startgame/play'));
            btnPlay.name = 'btnPlay';
            btnPlay.position.set(480, 260);
        },
        getCSImages: function () {
            var namePositions = [
                {
                    x: 271,
                    y: 403,
                },
                {
                    x: 6,
                    y: 403,
                }
            ]

            var arr = [];
            for (var i = 0; i < INME.Vars.characterNum; i++) {
                var prefix = 'startgame/chicken_' + i;
                arr.push({
                    light: {
                        key: 'images',
                        frame: 'startgame/light',
                    },
                    normal: {
                        key: 'images',
                        frame: prefix,
                    },
                    select: {
                        key: 'images',
                        frame: prefix + '_select',
                    },
                    name: {
                        key: 'images',
                        frame: INME.getFrameByLan(prefix + '_name'),
                        x: namePositions[i].x,
                        y: namePositions[i].y
                    }
                })
            }
            return arr;
        },
        getCSPositions: function () {
            return [
                {
                    x: -13,
                    y: 0,
                },
                {
                    x: 611,
                    y: 0
                }
            ]
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
            }
        },
    }

    function Character(game, group, image, position) {
        var sp = game.add.sprite();
        sp.position.set(position.x, position.y);
        group.add(sp);

        this.lightImg = sp.addChild(new Phaser.Image(game, 0, 0, image.light.key, image.light.frame));
        this.normalImg = sp.addChild(new Phaser.Image(game, 0, 0, image.normal.key, image.normal.frame));
        this.selectImg = sp.addChild(new Phaser.Image(game, 0, 0, image.select.key, image.select.frame));
        this.nameImg = sp.addChild(new Phaser.Image(game, image.name.x, image.name.y, image.name.key, image.name.frame));

        this.select(false);
    }

    Character.prototype.select = function (value) {
        if (value) {
            this.normalImg.alpha = 0;
            this.lightImg.alpha = 1;
            this.selectImg.alpha = 1;
            this.nameImg.alpha = 1;
        }
        else {
            this.normalImg.alpha = 1;
            this.lightImg.alpha = 0;
            this.selectImg.alpha = 0;
            this.nameImg.alpha = 0;
        }
    }

    function CharacterSelector(game, images, positions, callback, index) {
        var group = game.add.group();
        group.inputEnableChildren = true;
        group.onChildInputDown.add(handleClick);

        var characters = [];
        var len = images.length;
        for (var i = 0; i < len; i++) {
            var image = images[i];
            var position = positions[i];
            var character = new Character(game, group, image, position);
            characters.push(character);
        }

        characters[index].select(true);//设置初始选中状态

        function handleClick(sp) {
            var wantIndex = group.getChildIndex(sp);
            if (wantIndex !== index) {
                characters[wantIndex].select(true);
                characters[index].select(false);

                index = wantIndex;

                callback(index);
            }
        }
    }
})();