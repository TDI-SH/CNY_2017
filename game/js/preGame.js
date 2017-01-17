(function () {
    /**
     * state - Boot
     */
    INME.State.Boot = {
        init: function () {
            this.game.stage.backgroundColor = 0xffffff;

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
            this.game.load.image('loadingbar', 'assets/images/loading/loadingbar.png');
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
            container.style.width = '100%';
            container.style.height = '100%';
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
                'bg': this.game.add.audio('bg', 1, true),
                'getpacket': this.game.add.audio('getpacket'),
                'dead': this.game.add.audio('dead'),
            }
            this.game.state.start(INME.State.Key.Language);//测试
            //this.game.state.start(INME.State.Key.OverGame);
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
                console.log(text);
            }
        },
        handleClick: function (btn) {
            var lan = btn.name;
            INME.Vars.language = lan;
            this.game.state.start(INME.State.Key.Story);
            console.log(INME.Vars.language);
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

    /**
     * state - StartGame
     */
    // INME.State.StartGame = {
    //     create: function () {
    //         this.game.load.image('loadingbar', 'assets/images/loading/loadingbar.png');
    //     },

    //     generatePlayers: function(){

    //     }
    // }


    INME.State.StartGame = {
        create: function () {
            var btnPlay = new INME.Button(this.game, this.handleClick, this, 'btnLan', INME.getCopy('play'), 28);
            btnPlay.name = 'btnPlay';
            btnPlay.position.set(480, 420);

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
            }
        },
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
})();