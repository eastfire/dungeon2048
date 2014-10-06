define(function(require,exports,module) {
    var imageList = [
        "./img/warrior0-0.png",
        "./img/warrior0-1.png",
        "./img/warrior0-2.png",
        "./img/warrior0-3.png",
        "./img/warrior0-4.png",
        "./img/warrior1-0.png",
        "./img/warrior1-1.png",
        "./img/warrior1-2.png",
        "./img/warrior1-3.png",
        "./img/warrior1-4.png",
        "./img/warrior2-0.png",
        "./img/warrior2-1.png",
        "./img/warrior2-2.png",
        "./img/warrior2-3.png",
        "./img/warrior2-4.png",
        "./img/warrior3-0.png",
        "./img/warrior3-1.png",
        "./img/warrior3-2.png",
        "./img/warrior3-3.png",
        "./img/warrior3-4.png",

        "./img/archer3-0.png",
        "./img/archer3-3.png",
        "./img/archer3-4.png",
        "./img/archer3-5.png",
        "./img/goblin1-0.png",
        "./img/goblin1-3.png",
        "./img/goblin1-4.png",
        "./img/mimic2-0.png",
        "./img/mimic2-3.png",
        "./img/mimic2-4.png",
        "./img/minotaur2-0.png",
        "./img/minotaur0-3.png",
        "./img/minotaur0-4.png",
        "./img/minotaur2-3.png",
        "./img/minotaur2-4.png",
        "./img/minotaur3-3.png",
        "./img/minotaur3-4.png",
        "./img/ogre2-0.png",
        "./img/ogre2-3.png",
        "./img/ogre2-4.png",
        "./img/ogre3-3.png",
        "./img/ogre3-4.png",
        "./img/orc1-0.png",
        "./img/orc1-3.png",
        "./img/orc1-4.png",
        "./img/shaman2-0.png",
        "./img/shaman2-3.png",
        "./img/shaman2-4.png",
        "./img/slime2-0.png",
        "./img/slime2-1.png",
        "./img/slime2-2.png",
        "./img/skeleton2-0.png",
        "./img/skeleton2-3.png",
        "./img/skeleton2-4.png",
        "./img/skeleton3-3.png",
        "./img/skeleton3-4.png",
        "./img/snake1-0.png",
        "./img/snake1-3.png",
        "./img/snake1-4.png",
        "./img/vampire2-0.png",
        "./img/vampire2-3.png",
        "./img/vampire2-4.png",

        "./img/potion.png",

        "./img/status-angry.png",
        "./img/status-elite.png",
        "./img/status-poison.png",

        "./img/skill-constitution.png",
        "./img/skill-cunning.png",
        "./img/skill-cooling.png",
        "./img/skill-dexterity.png",
        "./img/skill-wisdom.png",
        "./img/skill-recover.png",
        "./img/skill-treasurehunting.png",
        "./img/skill-slash.png",
        "./img/skill-whirl.png"
    ];

    var imgLoad = function (url, callback) {
        var img = new Image();
        img.src = url;
        if (img.complete) {
            callback(img.width, img.height);
        } else {
            img.onload = function () {
                callback(img.width, img.height);
                img.onload = null;
            };
        }
        ;
    };

    var threadCount = 5;
    var loadedImageCount = 0;
    var totalImageCount = imageList.length;

    var initProgress = function () {

        $("body").append("<label class='loading-label'></label>")
        renderProgress();
    }
    var renderProgress = function () {
        $(".loading-label").html("Loading:" + Math.floor(loadedImageCount / totalImageCount * 100) + "%");
    }

    var endProgress = function () {
        $(".loading-label").remove();
    }

    exports.preload = function(callback){
        initProgress();

        var imageLoadAction = function () {
            var url = imageList.shift();
            if ( url ) {
                imgLoad(url, function () {
                    loadedImageCount++;
                    renderProgress();
                    if ( loadedImageCount >= totalImageCount ){
                        endProgress();
                        callback();
                    } else {
                        setTimeout(imageLoadAction, 1);
                    }
                })
            }
        }
        for ( var i = 0 ; i < threadCount ; i++)
            imageLoadAction();
    }
});
