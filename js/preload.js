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
        "./img/slime2-0.png",
        "./img/slime2-1.png",
        "./img/slime2-2.png",
        "./img/skeleton2-0.png",
        "./img/skeleton2-3.png",
        "./img/skeleton2-4.png",
        "./img/skeleton3-3.png",
        "./img/skeleton3-4.png",
        "./img/kobold2-0.png",
        "./img/goblin2-0.png",

        "./img/potion.png",
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

    var currentImageIndex;
    var initProgress = function () {
        currentImageIndex = 0
        $("body").append("<label class='loading-label'></label>")
        renderProgress();
    }
    var renderProgress = function () {
        $(".loading-label").html("Loading:" + Math.floor(currentImageIndex / imageList.length * 100) + "%");
    }

    var endProgress = function () {
        $(".loading-label").remove();
    }

    exports.preload = function(callback){
        initProgress();
        var imageLoadAction = function () {
            imgLoad(imageList[currentImageIndex], function () {
                currentImageIndex++;
                renderProgress();
                if (currentImageIndex >= imageList.length) {
                    endProgress();
                    callback();
                } else {
                    setTimeout(imageLoadAction, 1);
                }
            })
        }
        imageLoadAction();
    }
});
