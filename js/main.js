define(function(require,exports,module){
    window.clone = function(obj){
        return JSON.parse( JSON.stringify(obj) );
    }

    window.getRandomItem = function(array){
        if ( array.length == 0 )
            return null;
        return array[Math.floor(array.length*Math.random())];
    }

    var Model = require("./datamodel");
    var View = require("./view");
    var mainTemplate = _.template(require("../layout/main_window.html"));
    var Help = require("./help");
    var Skill = require("./skill");
    var HelpView = Help.HelpView;

    window.PHASE_GENERATE = 0;
    window.PHASE_USER = 1;
    window.PHASE_MOVE = 2;
    window.PHASE_HERO_TAKE_ITEM = 2.5;
    window.PHASE_HERO_ATTACK = 3;
    window.PHASE_MONSTER_ATTACK = 4;
    window.PHASE_GAME_OVER = 10;

    window.TIME_SLICE = 150;

    window.mapWidth = 5;
    window.mapHeight = 5;

    var initGameStatus = function() {
        window.gameStatus = {
            phase: PHASE_GENERATE,
            turn: 0,
            currentMonsterTypes: ["slime"],
            currentMonsterLevels:[1],
            generateMonsterNumber: 1,
            generateItemRate: 0,
            currentItemTypes:["potion"],
            tutorial:{
                on:true,
                step:0
            }
        }

        var store = localStorage.getItem("tutorial");
        if ( store != null ){
            gameStatus.tutorial.on = JSON.parse(store);
        }
    }

    var initSkillPool = function(){
        window.gameStatus.skillPool = Skill.getCommonSkillPool();
    }

    var calculateBlockSize = function(){
        var winW = 630, winH = 460;
        if (document.body && document.body.offsetWidth) {
            winW = document.body.offsetWidth;
            winH = document.body.offsetHeight;
        }
        if (document.compatMode=='CSS1Compat' &&
            document.documentElement &&
            document.documentElement.offsetWidth ) {
            winW = document.documentElement.offsetWidth;
            winH = document.documentElement.offsetHeight;
        }
        if (window.innerWidth && window.innerHeight) {
            winW = window.innerWidth;
            winH = window.innerHeight;
        }
        //console.log("winW:"+winW+" winH:"+winH);
        var blockW,blockH;
        if ( winW > winH ) {
            window.windowOriention = "landscape";
            blockW = blockH = (winH-mapWidth)/mapWidth;
        } else {
            window.windowOriention = "portrait";
            blockW = blockH = (winW-mapWidth)/mapWidth;
        }
        return {width:blockW, height:blockH}
    }

    window.generateItem = function(x,y, level){
        if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
            if ( Math.random() > gameStatus.generateItemRate*level )
                return;

            var block = map[x][y];
            block.model = new Model.Item({
                type:getRandomItem(gameStatus.currentItemTypes),
                position:{
                    x: x,
                    y: y
                }
            });
            var itemView = new View.ItemView({model:block.model});
            mapEl.append(itemView.render().$el);

            block.view = itemView;
            block.type = "item";
        }
    }

    var generateOneMonster = function(){
        if ( checkAllFill() )
            return;

        var x;
        var y;
        do {
            x = Math.floor(Math.random()*window.mapWidth);
            y = Math.floor(Math.random()*window.mapHeight);
        } while ( map[x][y].type != "blank" );

        var monsterType = getRandomItem(gameStatus.currentMonsterTypes);

        createOneMonster(monsterType, x,y);

        if ( !gameStatus.tutorial.on && !gameStatus.tutorial[monsterType] ) {
            gameStatus.tutorial[monsterType] = true;
            var description = Help.monsterDescription[monsterType];
            var view = new HelpView({text:description.text, imageClass:description.imageClass});
            view.show();
        }
    }

    var createOneMonster = function(monsterType, x, y){
        var block = map[x][y];
        block.type = "monster";
        var TempView = View.ViewMap[monsterType]
        var TempModel = Model.ModelMap[monsterType]
        var m = new TempModel({
            type:monsterType,
            level:getRandomItem(gameStatus.currentMonsterLevels),
            position:{
                x: x,
                y: y
            }
        })
        block.model = m;
        var monsterView = new TempView({model:m});
        mapEl.append(monsterView.render().$el);

        block.view = monsterView;
    }

    var generateMonster = function(){
        if ( gameStatus.tutorial.on ) {
            if (gameStatus.tutorial.step == 0) {
                createOneMonster("slime", 3, 2);
            } else if (gameStatus.tutorial.step == 1) {
                var hx = hero.get("position").x;
                var hy = hero.get("position").y;
                var mx, my;
                if (hx == 0) {
                    mx = 1;
                    my = hy - 1;
                } else if (hx == mapWidth - 2) {
                    mx = mapWidth - 3;
                    my = hy - 1;
                } else if (hy == 0) {
                    mx = hx - 1;
                    my = 1;
                } else if (hy == mapHeight - 1) {
                    mx = hx - 1;
                    my = hy - 1;
                }
                createOneMonster("slime", mx, my);
            } else if (gameStatus.tutorial.step == 2) {
                generateOneMonster();
            } else if (gameStatus.tutorial.step == 3) {
                generateOneMonster();
            }
        } else {
            for (var i = 0; i < gameStatus.generateMonsterNumber; i++) {
                generateOneMonster();
            }
        }

        if ( gameStatus.tutorial.on ) {
            if (gameStatus.tutorial.step == 0) {
                gameStatus.tutorial.step++;
                var view = new HelpView({text: "向右滑动手指移动英雄和所有的怪物<br/>(PC上请用方向键)"});
                view.show();
            } else if (gameStatus.tutorial.step == 1) {
                gameStatus.tutorial.step++;
                var view = new HelpView({text: "英雄移动完毕后会自动攻击并杀死面前的一个怪物"});
                view.show();
            } else if (gameStatus.tutorial.step == 2) {
                gameStatus.tutorial.step++;
                var view = new HelpView({text: "英雄移动并攻击后，所有能攻击英雄的怪物将会攻击英雄"});
                view.show();
            } else if (gameStatus.tutorial.step == 3) {
                gameStatus.tutorial.step++;
                var view = new HelpView({text: "同种类的怪物移动时会合并后升级，等级越高的怪物经验值越多，但是相应地攻击力越高"});
                view.show();
                gameStatus.tutorial.on = false;
                localStorage.setItem("tutorial", false);
            }
        }

        setTimeout(function(){
            gameStatus.phase = PHASE_USER;
        },TIME_SLICE+1);
    }

    var checkAllFill = function(){
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                if ( map[i][j].type == "blank" )
                    return false;
            }
        }
        return true;
    }

    var initMap = function(){
        var m = {};
        for ( var i = 0 ; i < mapWidth; i++){
            m[i]=[];
            for ( var j = 0 ; j < mapHeight; j++){
                m[i][j] = {
                    type:"blank",
                    model:null,
                    x:i,
                    y:j
                }
            }
        }
        return m;
    }

    var renderMapBlock = function(block){
        var el = $("<div></div>")
            .addClass("map-block")
            .css({
                position:"absolute",
                width: blockSize.width,
                height: blockSize.height,
                left:block.x*blockSize.width,
                top:block.y*blockSize.height
        })
        return el;
    }


    var renderMap = function () {
        $("body").html(mainTemplate());
        mapEl = $(".map");
        mapEl.css({
            "font-size":blockSize.height/5+"px",
            width:mapWidth*blockSize.width,
            height:mapHeight*blockSize.height
        })
        if ( windowOriention == "portrait") {
            $(".main-window").css({
                width:mapWidth*blockSize.width
            })
        } else {
            $(".main-window").css({
                height:mapHeight*blockSize.height
            })
        }
        $(".main-window").addClass(window.windowOriention);
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                mapEl.append(renderMapBlock(map[i][j]));
            }
        }
    }

    var renderHeroStatus = function() {

    }

    var renderMonsterStatus = function(monster){

    }

    var initEvent = function(){
        var hammertime = Hammer($('.map')[0]).on("swipeup", function(event) {
            if ( gameStatus.phase == PHASE_USER && !gameStatus.showingTutorial )
                calMove(0);
        }).on("swiperight", function(event) {
            if ( gameStatus.phase == PHASE_USER && !gameStatus.showingTutorial )
                calMove(1);
        }).on("swipedown", function(event) {
            if ( gameStatus.phase == PHASE_USER && !gameStatus.showingTutorial )
                calMove(2);
        }).on("swipeleft", function(event) {
            if ( gameStatus.phase == PHASE_USER && !gameStatus.showingTutorial )
                calMove(3);
        });

        $(document).on("keydown",function(event){
            if ( gameStatus.phase != PHASE_USER || gameStatus.showingTutorial )
                return;
            switch(event.keyCode){
                case 38:
                    calMove(0);
                    break;
                case 39:
                    calMove(1);
                    break;
                case 40:
                    calMove(2);
                    break;
                case 37:
                    calMove(3);
                    break;
            }
        })
    }

    window.increment = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}]
    var calMapBlock = function(mapblock, direction){
        var curx = mapblock.x;
        var cury = mapblock.y;
        var movement = 0;
        var mytype = mapblock.type;
        if ( mytype == "blank" )
            return;

        var mymodel = mapblock.model;

        do {
            curx += increment[direction].x;
            cury += increment[direction].y;
            if ( curx >= mapWidth || cury >= mapHeight || curx < 0 || cury < 0 )
                break;
            var curblock = window.map[curx][cury];
            if ( curblock.type == "blank" ) {
                movement ++;
            } else if ( mytype == curblock.type ){
                if ( mymodel.get("type") == curblock.model.get("type") ) {
                    //can merge
                    movement += (curblock.movement + 1);
                    mapblock.merge = true;
                    if ( curblock.mergeTo == null ) {
                        mapblock.mergeTo = curblock.model;
                    } else {
                        mapblock.mergeTo = curblock.mergeTo;
                    }
                    break;
                } else {
                    movement += curblock.movement;
                    break;
                }
            } else if ( mytype != curblock.type ) {
                movement += curblock.movement;
                break;
            }
        } while ( true );

        mapblock.movement = movement;
        //if ( movement > 0 )
        //    console.log(mytype+" x:"+mapblock.x + " y:"+mapblock.y+ " move"+direction+":"+mapblock.movement);
    }

    var calMove = function(direction) {
        window.moveDirection = direction;
        //console.log("--MAP--")
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                map[i][j].movement = 0;
                map[i][j].merge = false;
                map[i][j].mergeTo = null;
                /*if ( map[i][j].model ) {
                    console.log("x:"+i+" y:"+j+" model:"+map[i][j].model.get("type"))
                }*/
            }
        }
        //console.log("--MAP END--")

        switch (direction){
            case 0:
                for ( var j = 1; j < mapHeight; j++  ){
                    for ( var i = 0; i < mapWidth; i++) {
                        calMapBlock(map[i][j], direction);
                    }
                }
                break;
            case 1:
                for ( var i = mapWidth-2; i >= 0; i--  ){
                    for ( var j = 0; j < mapHeight; j++) {
                        calMapBlock(map[i][j], direction);
                    }
                }
                break;
            case 2:
                for ( var j = mapHeight-2; j >= 0; j--  ){
                    for ( var i = 0; i < mapWidth; i++) {
                        calMapBlock(map[i][j], direction);
                    }
                }
                break;
            case 3:
                for ( var i = 1; i < mapWidth; i++  ){
                    for ( var j = 0; j < mapHeight; j++) {
                        calMapBlock(map[i][j], direction);
                    }
                }
                break;
        }
        gameStatus.phase = PHASE_MOVE;
        startMove(window.moveDirection);
    }

    var startMove = function(direction){
        var maxMovement = 0;
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                var block = map[i][j];
                if ( block.model ) {
                    block.model.set("direction",direction);
                }
                if ( block.movement > 0 && block.view != null ){
                    if ( block.movement > maxMovement )
                        maxMovement = block.movement;
                    block.view.move(block.movement,direction);
                }
            }
        }

        setTimeout(function(){
            gameStatus.phase = PHASE_HERO_TAKE_ITEM;
            heroTakeItem();
        },maxMovement*TIME_SLICE+1);
    }

    var heroTakeItem = function(){
        var direction = window.moveDirection;
        var pass = heroView.takeItem(direction);
        setTimeout(function(){
            gameStatus.phase = PHASE_HERO_ATTACK;
            heroAttack();
        },pass ? 1 : 2*TIME_SLICE+1);
    }

    var heroAttack = function(){
        var direction = window.moveDirection;
        var pass = heroView.attack(direction);
        setTimeout(function(){
            gameStatus.phase = PHASE_MONSTER_ATTACK;
            monsterAttack();
        },pass ? 1 : 4*TIME_SLICE+1);
    }

    var monsterAttack = function(){
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                var block = map[i][j];
                if ( block.type == "monster" ){
                    block.view.attack();
                }
            }
        }
        setTimeout(function(){
            if ( gameStatus.phase != PHASE_GAME_OVER )
                nextTurn();
        },TIME_SLICE+1);
    }

    var nextTurn = function(){
        if ( checkAllFill() ) {
            gameOver();
            return;
        }
        gameStatus.phase = PHASE_GENERATE;
        gameStatus.turn ++;
        if ( gameStatus.turn == 6 ) {
            gameStatus.generateItemRate = 0.1;
            gameStatus.currentMonsterTypes.push("skeleton")
        } else if ( gameStatus.turn == 18 ) {
            gameStatus.currentMonsterTypes.push("slime")
            gameStatus.currentMonsterTypes.push("skeleton")
            gameStatus.currentMonsterTypes.push("ogre")
        } else if ( gameStatus.turn == 36 ) {
            gameStatus.generateMonsterNumber = 2;
        } else if ( gameStatus.turn == 50 ) {
            gameStatus.currentMonsterTypes.push("ogre")
        } else if ( gameStatus.turn == 100 ) {
            gameStatus.currentMonsterLevels.push(1);
            gameStatus.currentMonsterLevels.push(1);
            gameStatus.currentMonsterLevels.push(2);
            gameStatus.currentMonsterTypes.push("archer")
        } else if ( gameStatus.turn == 120 ) {
            gameStatus.currentMonsterTypes.push("skeleton")
            gameStatus.currentMonsterTypes.push("ogre")
            gameStatus.currentMonsterTypes.push("archer")
        } else if ( gameStatus.turn == 150 ) {
            gameStatus.currentMonsterLevels.push(2);
        }

        generateMonster();
    }

    window.gameOver = function(){
        if (gameStatus.phase == PHASE_GAME_OVER )
            return
        gameStatus.phase = PHASE_GAME_OVER;
        setTimeout(function(){
            $(".map").append("<label class='game-over'>GAME OVER</label>" +
                "<button class='btn btn-primary restart-game'>再来一局</button>");
            $(".game-over").css({
                width: blockSize.width * mapWidth,
                height: blockSize.height * mapHeight,
                "line-height":blockSize.height * mapHeight/3*2+"px"
            })
            $(".restart-game").on("click",function(){
                startGame();
            });
        },TIME_SLICE);
    }

    document.ontouchmove = function(event){
        event.preventDefault();
    }

    var startGame = function(){
        $("body").empty();
        initGameStatus();
        window.map = initMap();

        hero = new Model.Hero();
        heroView = new View.HeroView({model:hero});
        renderMap();
        mapEl.append(heroView.render().$el);

        heroStatusView = new View.HeroStatusView({el:$(".hero-status"), model:hero})
        heroStatusView.render();

        initEvent();

        var block = map[hero.get("position").x][hero.get("position").y];
        block.type = "hero";
        block.model = hero;
        block.view = heroView;

        setTimeout(generateMonster, TIME_SLICE);
    }

    require("./preload").preload(function(){
        window.blockSize = calculateBlockSize();

        startGame();
    })
});
