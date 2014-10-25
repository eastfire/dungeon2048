define(function(require,exports,module) {
    var imageList = [
        "dungeon-tile.jpg",

        "warrior0-0.png",
        "warrior0-3.png",
        "warrior0-4.png",
        "warrior1-0.png",
        "warrior1-3.png",
        "warrior1-4.png",
        "warrior2-0.png",
        "warrior2-3.png",
        "warrior2-4.png",
        "warrior3-0.png",
        "warrior3-3.png",
        "warrior3-4.png",

        "priest0-0.png",
        "priest0-3.png",
        "priest0-4.png",
        "priest1-0.png",
        "priest1-3.png",
        "priest1-4.png",
        "priest2-0.png",
        "priest2-3.png",
        "priest2-4.png",
        "priest3-0.png",
        "priest3-3.png",
        "priest3-4.png",
        "priest2-5.png",
        "priest2-6.png",

        "wizard0-0.png",
        "wizard0-3.png",
        "wizard0-4.png",
        "wizard1-0.png",
        "wizard1-3.png",
        "wizard1-4.png",
        "wizard2-0.png",
        "wizard2-3.png",
        "wizard2-4.png",
        "wizard3-0.png",
        "wizard3-3.png",
        "wizard3-4.png",

        "archer3-0.png",
        "archer3-3.png",
        "archer3-4.png",
        "archer3-5.png",
        "gargoyle1-0.png",
        "gargoyle1-3.png",
        "gargoyle1-4.png",
        "ghost1-0.png",
        "ghost1-3.png",
        "ghost1-4.png",
        "goblin1-0.png",
        "goblin1-3.png",
        "goblin1-4.png",
        "golem1-0.png",
        "golem1-3.png",
        "golem1-4.png",
        "kobold2-0.png",
        "kobold2-3.png",
        "kobold2-4.png",
        "medusa1-0.png",
        "medusa1-3.png",
        "medusa1-4.png",
        "mimic2-0.png",
        "mimic2-3.png",
        "mimic2-4.png",
        "minotaur2-0.png",
        "minotaur0-3.png",
        "minotaur0-4.png",
        "minotaur2-3.png",
        "minotaur2-4.png",
        "minotaur3-3.png",
        "minotaur3-4.png",
        "ogre2-0.png",
        "ogre2-3.png",
        "ogre2-4.png",
        "orc1-0.png",
        "orc1-3.png",
        "orc1-4.png",
        "shaman2-0.png",
        "shaman2-3.png",
        "shaman2-4.png",
        "slime2-0.png",
        "slime2-1.png",
        "slime2-2.png",
        "skeleton2-0.png",
        "skeleton2-3.png",
        "skeleton2-4.png",
        "snake1-0.png",
        "snake1-3.png",
        "snake1-4.png",
        "troll1-0.png",
        "troll1-3.png",
        "troll1-4.png",
        "troll1-5.png",
        "vampire2-0.png",
        "vampire2-3.png",
        "vampire2-4.png",

        "boss-beholder2-0.png",
        "boss-beholder2-3.png",
        "boss-beholder2-4.png",
        "boss-death2-0.png",
        "boss-death2-3.png",
        "boss-death2-4.png",
        "boss-hydra1-0.png",
        "boss-hydra1-3.png",
        "boss-hydra1-4.png",

        "potion.png",

        "status-angry.png",
        "status-elite.png",
        "status-poison.png",
        "status-freeze.png",
        "status-locked.png",
        "icon-hourglass.png",

        "skill-constitution.png",
        "skill-cunning.png",
        "skill-cooling.png",
        "skill-dexterity.png",
        "skill-wisdom.png",
        "skill-recover.png",
        "skill-treasurehunting.png",

        "skill-slash.png",
        "skill-whirl.png",
        "skill-big-whirl.png",
        "skill-horizontal-slash.png",
        "skill-vertical-slash.png",
        "skill-cross-slash.png",

        "skill-heal.png",
        "skill-confuse-undead.png",
        "skill-turn-undead.png",
        "skill-holy-shield.png",
        "skill-dispel.png",
        "skill-resurrection.png",

        "skill-magic-missile.png",
        "skill-spider-web.png",
        "skill-teleport.png",
        "skill-lightening-chain.png",

        "loading.gif"
    ];

    var imgLoad = function (url, callback) {
        var img = new Image();
        img.src = "./img/"+url;
        $(img).addClass("preload")
        $("body").append(img);
        $(img).css({
            width:1,
            height:1
        });
        if (img.complete) {
            callback(img.width, img.height);
        } else {
            img.onload = function () {
                callback(img.width, img.height);
                img.onload = null;
                //img.remove();
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
