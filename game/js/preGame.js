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
                this.game.scale.onSizeChange.add(this.resizeHandler, this)
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
        resizeHandler: function () {
            this.responsiveDom();
        },
        orientationHandler: function (paused) {
            var display = paused === true ? 'block' : 'none';
            this.game.paused = paused;
            document.querySelector('.msg__landscape').style.display = display;
            if (INME.Vars.language !== '')
                document.querySelector('.msg__landscape>p').textContent = INME.getCopy('landscape');
        },
        //在手机端对dom层做响应式布局
        responsiveDom: function () {
            var container = document.querySelector('.container');
            var scaleW = window.innerWidth / this.game.width;
            var scaleH = window.innerHeight / this.game.height;
            var scale = Math.min(scaleW, scaleH);
            var roundScale = (scale + 0.01).toFixed(2);
            var value = 'translate(-50%,-50%) scale(' + roundScale + ',' + roundScale + ')';
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
                'bg': this.game.add.audio('bg', 0.5, true),
                'getpacket': this.game.add.audio('getpacket', 0.5),
                'dead': this.game.add.audio('dead', 0.5),
            }
            this.game.state.start(INME.State.Key.Language);
        },
    }
    /**
     * state - Language
     */

    INME.State.Language = {
        create: function () {
            var x = this.game.width >> 1;
            var padding = 88;
            var y = 183;

            var lans = INME.Vars.languages;
            var len = lans.length;
            for (var i = 0; i < len; i++) {
                var lan = lans[i];
                var btn = new INME.Button2(this.game, this.handleClick, this, 'images', 'language/button_bg', 'language/button_bg', 'language/button_' + lan);
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

    INME.State.Story = {
        create: function () {
            var story = this.game.add.sprite(0, 0, 'images2', INME.getFrameByLan('story/story'));
            story.inputEnabled = true;
            story.events.onInputDown.add(this.handleClick, this);

            this.cookieLanguage(INME.Vars.language);
        },
        handleClick: function () {
            this.game.state.start(INME.State.Key.StartGame);
        },
        cookieLanguage: function (language) {
            var description = document.getElementById("description");
            var linkAddress = document.getElementById("cookieLink");
            var btn_continue = document.getElementById("button_continue");
            var btn_findmore = document.getElementById("button_more");
            switch (language) {
                case "sc":
                    description.innerHTML = "此游戏运用第三方社交平台cookie来分享本网信息";
                    btn_continue.style.backgroundImage = "url('assets/cookie_button/btnContinue_sc.png')";
                    btn_findmore.style.backgroundImage = "url('assets/cookie_button/btnFind_sc.png')";
                    linkAddress.setAttribute('href', 'cookie_sc.html')
                    break;
                case "tc":
                    description.innerHTML = "此遊戲運用第三方社交平台cookie來分享本網信息";
                    btn_continue.style.backgroundImage = "url('assets/cookie_button/btnContinue_tc.png')";
                    btn_findmore.style.backgroundImage = "url('assets/cookie_button/btnFind_tc.png')";
                    linkAddress.setAttribute('href', 'cookie_tc.html')
                    break;
            }
            console.log(INME.Vars.language);
            setupCookie();
        }
    }

    INME.State.StartGame = {
        create: function () {
            //角色选择
            new CharacterSelector(this.game, this.getCSImages(), this.getCSPositions(), this.selectCharacter, INME.Vars.characterIndex);
            //前景
            this.game.add.image(0, 310, 'images2', 'startgame/greatWall');
            //标题
            var title = this.game.add.image(0, 0, 'images2', INME.getFrameByLan('startgame/title'));
            title.anchor.set(0.5, 0.5);
            title.position.set(this.game.width >> 1, 100);
            //开始按钮
            var btnPlay = new INME.Button2(this.game, this.handleClick, this, 'images2', 'startgame/btnOver', 'startgame/btn', INME.getFrameByLan('startgame/play'));
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
            var stops = [
                4, 1
            ]

            var arr = [];
            for (var i = 0; i < INME.Vars.characterNum; i++) {
                var prefix = 'startgame/chicken_' + i;
                arr.push({
                    light: {
                        'key': 'images2',
                        'frame': 'startgame/light',
                    },
                    normal: {
                        'key': 'images2',
                        'frame': prefix,
                    },
                    select: {
                        'prefix': prefix + '_select/',
                        'start': 0,
                        'stop': stops[i],
                        'frameRate': 5,
                        'loop': true,
                    },
                    name: {
                        'key': 'images2',
                        'frame': INME.getFrameByLan(prefix + '_name'),
                        'x': namePositions[i].x,
                        'y': namePositions[i].y
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
        var sp = game.add.sprite(0, 0, image.normal.key, image.normal.frame);
        sp.position.set(position.x, position.y);
        group.add(sp);

        this.lightImg = sp.addChild(new Phaser.Image(game, 0, 0, image.light.key, image.light.frame));

        this.selectImg = sp.addChild(new Phaser.Image(game, 0, 0, image.normal.key, image.normal.frame));
        this.normalFrame = image.normal.frame;
        this.selectImg.animations.add('select', Phaser.Animation.generateFrameNames(image.select.prefix, image.select.start, image.select.stop), image.select.frameRate, image.select.loop);

        this.nameImg = sp.addChild(new Phaser.Image(game, image.name.x, image.name.y, image.name.key, image.name.frame));

        this.select(false);
    }

    Character.prototype.select = function (value) {
        if (value) {
            this.lightImg.alpha = 1;
            this.nameImg.alpha = 1;
            this.selectImg.animations.play('select');
        }
        else {
            this.lightImg.alpha = 0;
            this.nameImg.alpha = 0;
            this.selectImg.frameName = this.normalFrame;
            this.selectImg.animations.stop('select');
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
    // cookie setups
    function setupCookie() {
        if (INME.cookie.get('agreecookie') === undefined) {
            displayDom(document.querySelector('.cookie'));

            document.querySelector('.cookie__btnContinue').addEventListener('click', function removeCookie() {
                INME.cookie.set('agreecookie', 'agreecookie', new Date(2020, 0, 1));
                displayDom(document.querySelector('.cookie'), false, true);
            });
        }
        if (INME.cookie.get('agreecookie') === 'agreecookie') {
            displayDom(document.querySelector('.cookie'), false, true);
        }
    }

    function displayDom(dom, isVisible, isDispose) {
        isVisible = isVisible === undefined ? true : isVisible;
        isDispose = isDispose === undefined ? false : isDispose;

        if (isVisible)
            dom.style.display = 'block';
        else
            dom.style.display = 'none';

        if (isDispose) {
            dom.parentNode.removeChild(dom);
        }
    }
})();