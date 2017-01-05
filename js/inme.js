var INME = INME || {};
(function () {
    INME.Vars = {
        speed: 1,
        characterIndex: 0,
        characterNum: 2,
        characterPrefix: 'chicken',
        velocity: -550,
        gravity: 2000,
        score: 0
    };

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
    };
})();
