define(function(require,exports,module){
    try {
        var appCache = window.applicationCache;

        appCache.update(); // 开始更新

        if (appCache.status == window.applicationCache.UPDATEREADY) {
            appCache.swapCache();  // 得到最新版本缓存列表，并且成功下载资源，更新缓存到最新
        }
    } catch ( e ){
        console.log(e)
    }

    var Model = require("./datamodel");
    var View = require("./view");
    var mainTemplate = _.template(require("../layout/main_window.html"));
    var Help = require("./help");
    var Skill = require("./skill");
    var HelpView = Help.HelpView;
    var ScoreBoard = require("./score-board");
    var Unlock = require("./unlock")

    window.PHASE_GENERATE = 0;
    window.PHASE_USER = 1;
    window.PHASE_MOVE = 2;
    window.PHASE_HERO_TAKE_ITEM = 2.5;
    window.PHASE_HERO_ATTACK = 3;
    window.PHASE_MONSTER_ATTACK = 4;
    window.PHASE_GAME_OVER = 10;

    window.PHASE_ASK_DIRECTION = 1.1;
    window.PHASE_ASK_BLOCK = 1.2;
    window.PHASE_ASK_MONSTER = 1.3;
    window.PHASE_ASK_EMPTY_BLOCK = 1.4;
    window.PHASE_ASK_ITEM = 1.5;
    window.PHASE_VERTICAL_LINE = 1.6;
    window.PHASE_HORIZONTAL_LINE = 1.7;

    window.TIME_SLICE = 150;

    window.mapWidth = 5;
    window.mapHeight = 5;

    var initGameStatus = function() {
        window.gameStatus = {
            phase: PHASE_GENERATE,
            turn: 0,
            currentMonsterWave: ["slime"],
            currentMonsterTypeNumber:1,
            monsterPool:["archer","ghost","goblin","medusa","mimic","minotaur","ogre","orc","shaman","skeleton","slime","snake","vampire"],
            currentMonsterTypes: ["slime"],
            currentMonsterLevels:[1],
            currentMonsterMaxLevel : 1,
            currentBossTypes:["boss-death"],
            generateItemRate: 0,
            currentItemTypes:["potion"],
            tutorial:{
                on:true,
                step:0
            },
            gainStar:0
        }

        var store = localStorage.getItem("tutorial");
        if ( store != null ){
            gameStatus.tutorial.on = JSON.parse(store);
        }
    }

    var initSkillPool = function(){
        window.gameStatus.skillPool = Skill.getSkillPool("warrior");
    }

    var initUnlock = function(){
        _.each(Unlock.AllUnlocks,function(unlock){
            unlock.onStartGame.call(unlock);
        })
    }

    var calculateBlockSize = function(){
        window.winW = 630;
        window.winH = 460;
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
            blockW = blockH = (winH)/mapWidth-0.1;
        } else {
            window.windowOriention = "portrait";
            blockW = blockH = (winW)/mapWidth-0.1;
        }
        return {width:blockW, height:blockH}
    }

    window.generateItem = function(x,y, monsterLevel){
        if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
            if ( Math.random() > gameStatus.generateItemRate*(monsterLevel+hero.get("treasureHunting")) )
                return;

            generateItemForSure(x,y,1);
        }
    }

    window.generateItemForSure=function(x,y, itemLevel){
        var block = map[x][y];
        block.model = new Model.Item({
            type:getRandomItem(gameStatus.currentItemTypes),
            position:{
                x: x,
                y: y
            },
            level: itemLevel
        });
        var itemView = new View.ItemView({model:block.model});
        mapEl.append(itemView.render().$el);

        block.view = itemView;
        block.type = "item";
    }

    var calMonsterWave = function(){
        var monsterType = "";
        do {
            monsterType = getRandomItem(gameStatus.monsterPool)
        } while ( isInArray(gameStatus.currentMonsterWave, monsterType) )
        if ( gameStatus.currentMonsterTypeNumber > gameStatus.currentMonsterWave.length ){
            //add a monster
            gameStatus.currentMonsterWave.unshift( monsterType )
        } else {
            //replace a monster
            gameStatus.currentMonsterWave.pop();
            gameStatus.currentMonsterWave.unshift( monsterType )
        }

        gameStatus.currentMonsterTypes = [];
        for ( var i = 0; i < gameStatus.currentMonsterWave.length; i++){
            for ( var j = 0; j < i+1; j++ ){
                gameStatus.currentMonsterTypes.push( gameStatus.currentMonsterWave[i]);
            }
        }
    }

    var calMonsterLevel = function(){
        gameStatus.currentMonsterMaxLevel ++;
        gameStatus.currentMonsterLevels = [];
        for ( var i = 1; i <= gameStatus.currentMonsterMaxLevel; i++) {
            for (var j = 0; j < i; j++){
                gameStatus.currentMonsterLevels.push(gameStatus.currentMonsterMaxLevel-i+1);
            }
        }
    }

    var generateBoss = function(){
        if ( checkAllFarFill() )
            return false;
        var x;
        var y;
        do {
            x = Math.floor(Math.random()*window.mapWidth);
            y = Math.floor(Math.random()*window.mapHeight);
        } while ( map[x][y].type != "blank" || hero.isPositionNear(x,y) );

        var monsterType = getRandomItem(gameStatus.currentBossTypes);
        createOneMonster(monsterType, x,y);

        if ( !gameStatus.tutorial.on && !gameStatus.tutorial[monsterType] ) {
            gameStatus.tutorial[monsterType] = true;
            (function(monsterType) {
                setTimeout(function () {
                    var description = Help.monsterDisplayName[monsterType] + "<br/>" + Help.monsterDescription[monsterType].text;
                    var view = new HelpView({text: description, imageClass: Help.monsterDescription[monsterType].imageClass});
                    view.show();
                }, TIME_SLICE );
            })(monsterType);
        }
        return true;
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
            (function(monsterType) {
                setTimeout(function () {
                    var description = Help.monsterDisplayName[monsterType] + "<br/>" + Help.monsterDescription[monsterType].text;
                    var view = new HelpView({text: description, imageClass: Help.monsterDescription[monsterType].imageClass});
                    view.show();
                }, TIME_SLICE );
            })(monsterType);
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
        mapEl.append(monsterView.generate().$el);

        block.view = monsterView;
        /*setTimeout(function(){
            monsterView.onGenerate.call(monsterView);
        },10)*/
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
            (function(monsterType) {
                setTimeout(function () {
                    var description = Help.monsterDisplayName[monsterType] + "<br/>" + Help.monsterDescription[monsterType].text;
                    var view = new HelpView({text: description, imageClass: Help.monsterDescription[monsterType].imageClass});
                    view.show();
                }, TIME_SLICE );
            })(monsterType);
        }
    }

    var generateMonster = function(){
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                var m = map[i][j];
                if ( m.view instanceof View.MonsterView ){
                    m.view.onNewRound.call(m);
                }
            }
        }
        window.heroView.onNewRound();

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
            var spaceCount = getFreeSpaceCount();
            if ( spaceCount >= 5)
                generateNumber = 2;
            else
                generateNumber = 1;
            for (var i = 0; i < generateNumber; i++) {
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
        },TIME_SLICE*5/4);
    }

    var removeSkillFromPool = function(skill){
        for ( var i = 0; i < window.gameStatus.skillPool.length ; i++) {
            if ( window.gameStatus.skillPool[i].get("name") == skill.get("name") ) {
                window.gameStatus.skillPool.splice(i,1);
                return;
            }
        }
    }

    var removeAllOtherActiveSkillFromPool = function(){
        var newPool = [];
        for ( var i = 0; i < window.gameStatus.skillPool.length ; i++) {
            var skill = window.gameStatus.skillPool[i];
            if ( skill.get("type") != "active" || window.heroView.hasSkill(skill)) {
                newPool.push(window.gameStatus.skillPool[i])
            }
        }
        window.gameStatus.skillPool = newPool;
    }

    window.showLevelUpDialog = function(callback){
        var skillArray = getRandomItems(window.gameStatus.skillPool, 2);
        if ( skillArray == null || skillArray.length == 0 ){
            callback.call();
            return;
        }
        var el = $("<div class='levelup-body'>你升级了！<br/>请选择技能</div>");
        gameStatus.showingDialog = true;
        $(".main-window").append(el);
        _.each(skillArray, function(model){
            var view = new Skill.SkillView({model: model, mode:"select"})
            el.append(view.render().$el)
            view.$el.on("click",function(){
                var model = view.model;
                if ( model.onGet ) {
                    model.onGet.call(model);
                } else {
                    window.heroView.getSkill(model);
                    if ( window.heroView.isSkillSlotFull() ){
                        removeAllOtherActiveSkillFromPool();
                    }
                }
                model.levelup();
                if ( model.get("level") >= model.get("maxLevel") ) {
                    removeSkillFromPool(model);
                }
                gameStatus.showingDialog = false;
                $(".levelup-body").remove();
                callback.call();
            })
        })
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

    var checkAllFarFill = function(){
        var hx = hero.get("position").x;
        var hy = hero.get("position").y;
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                if ( map[i][j].type == "blank" && !hero.isPositionNear(i,j) )
                    return false;
            }
        }
        return true;
    }

    var getFreeSpaceCount = function(){
        var count = 0;
        for ( var i = 0 ; i < mapWidth; i++){
            for ( var j = 0 ; j < mapHeight; j++){
                if ( map[i][j].type == "blank" )
                    count++;
            }
        }
        return count;
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
        $("body .main-window-wrapper").html(mainTemplate());
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
                var mapBlock = renderMapBlock(map[i][j]);
                mapBlock.attr({
                    x:i,
                    y:j,
                    id: "mapblock"+i+"_"+j
                })
                mapEl.append(mapBlock);
                mapBlock.on("click", function () {
                    var x = $(this).attr("x");
                    var y = $(this).attr("y");
                    //console.log("x:"+x+" y:"+y)
                    if (gameStatus.phase == window.PHASE_ASK_BLOCK) {
                        returnUserInput({
                            x: x,
                            y: y
                        })
                    } else if (gameStatus.phase == window.PHASE_ASK_EMPTY_BLOCK) {
                        if (map[x][y].type == "blank")
                            returnUserInput({
                                x: x,
                                y: y
                            })
                    } else if (gameStatus.phase == window.PHASE_ASK_MONSTER) {
                        if (map[x][y].type == "monster")
                            returnUserInput(map[x][y].view)
                    } else if (gameStatus.phase == window.PHASE_ASK_ITEM) {
                        if (map[x][y].type == "item")
                            returnUserInput(map[x][y].view)
                    }
                })
            }
        }
    }

    var renderHeroStatus = function() {

    }

    var renderMonsterStatus = function(monster){

    }

    window.askContext = null;
    window.askUserInput = function(what, callback, context, additionalParams){
        var prevPhase = gameStatus.phase;
        gameStatus.phase = window["PHASE_ASK_"+what.toUpperCase()];
        askContext = {
            callback:callback,
            context:context,
            params:additionalParams,
            prevPhase: prevPhase
        };
    }

    var returnUserInput = function(result){
        window.askContext.callback.call(askContext.context, result, askContext.params);
        gameStatus.phase = askContext.prevPhase;
    }

    window.isDirectionInputValid = function(){
        return (gameStatus.phase == PHASE_USER || gameStatus.phase == PHASE_ASK_DIRECTION ) && !gameStatus.showingDialog;
    }

    var directionInput = function(direction){
        if ( gameStatus.phase == PHASE_ASK_DIRECTION ) {
            returnUserInput(direction);
        } else
            calMove(direction);
    }

    var initEvent = function(){
        var hammertime = Hammer($('.map')[0],{
            swipe_velocity:0.08
        })
        hammertime.on("swipeup", function(event) {
            if ( window.isDirectionInputValid() )
                directionInput(0);
        }).on("swiperight", function(event) {
            if ( window.isDirectionInputValid() )
                directionInput(1);
        }).on("swipedown", function(event) {
            if ( window.isDirectionInputValid() )
                directionInput(2);
        }).on("swipeleft", function(event) {
            if ( window.isDirectionInputValid() )
                directionInput(3);
        });

        $(document).on("keydown",function(event) {
            if (gameStatus.showingDialog) {
                if ( $(".help").length ) {
                    $(".help").remove();
                    window.gameStatus.showingDialog = false;
                    return;
                }
            }
            if ( !window.isDirectionInputValid() )
                return;
            switch(event.keyCode){
                case 38:
                    directionInput(0);
                    break;
                case 39:
                    directionInput(1);
                    break;
                case 40:
                    directionInput(2);
                    break;
                case 37:
                    directionInput(3);
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

        if (mymodel.get("freeze")) {
            mapblock.movement = 0;
            return;
        }
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
                        mapblock.mergeToView = curblock.view;
                    } else {
                        mapblock.mergeTo = curblock.mergeTo;
                        mapblock.mergeToView = curblock.mergeToView;
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
                var m = map[i][j];
                m.movement = 0;
                m.merge = false;
                m.mergeTo = null;
                m.mergeToView = null;
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

    var waitForMonsterAttack = function(){
        if ( gameStatus.phase == PHASE_MONSTER_ATTACK && !gameStatus.showingDialog ){
            monsterAttack();
        } else {
            setTimeout(waitForMonsterAttack, TIME_SLICE)
        }
    }

    var heroAttack = function(){
        var direction = window.moveDirection;
        window.prevLevel = hero.get("level");
        var pass = heroView.attack(direction);
        setTimeout(function(){
            gameStatus.phase = PHASE_MONSTER_ATTACK;
            waitForMonsterAttack();
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
            gameStatus.killBy={
                type:"full"
            }
            gameOver();
            return;
        }
        gameStatus.phase = PHASE_GENERATE;
        gameStatus.turn ++;
        if ( gameStatus.turn == 6) {
            gameStatus.generateItemRate = TREASURE_HUNTING_EFFECT/100;
            gameStatus.currentMonsterTypeNumber = 2;
            calMonsterWave();
        } else if ( gameStatus.turn == 30 ) {
            gameStatus.currentMonsterTypeNumber = 3;
            calMonsterWave();
        } else if ( gameStatus.turn == 60 ) {
            gameStatus.currentMonsterTypeNumber = 4;
            calMonsterWave();
        } else {
            if ( gameStatus.turn % 31 == 0 ) {
                calMonsterWave();
            }
            if ( gameStatus.turn % 97 == 0 ) {
                calMonsterLevel();
            }
        }

        generateMonster();

        if ( gameStatus.turn % 211 == 0 || gameStatus.tryingToGenerateBoss ) {
            gameStatus.tryingToGenerateBoss = true;
            var success = generateBoss();
            if ( success ) {
                gameStatus.tryingToGenerateBoss = false;
            }
        }
    }

    window.gameOver = function(){
        if (gameStatus.phase == PHASE_GAME_OVER )
            return
        if ( gameStatus.killBy )
            gameStatus.death = {
                name : window.hero.get("name"),
                type : window.hero.get("typeDisplayName"),
                score : window.hero.get("score"),
                level : window.hero.get("level"),
                killBy :gameStatus.killBy,
                timestamp : Firebase.ServerValue.TIMESTAMP,//(new Date()).getTime(),
                ".priority":window.hero.get("score")
            }
        else
            gameStatus.death = null;

        gameStatus.phase = PHASE_GAME_OVER;
        setTimeout(function(){
            var view = new ScoreBoard.GameOver();
            $(".main-window").append(view.render().$el);
            $(".hero-active-skill").hide();
            /*var scoreBoard = new ScoreBoard.ScoreBoard({currentScore:gameStatus.death})
            $(".map").append(scoreBoard.render().$el);
            $(".map").append("<label class='game-over'>GAME OVER</label>" +
                "<button class='btn btn-primary restart-game'>再来一局</button>");
            $(".game-over").css({
                width: blockSize.width * mapWidth,
                height: blockSize.height * mapHeight,
                "line-height":blockSize.height * mapHeight/3*2+"px"
            })
            $(".restart-game").on("click",function(){
                startGame();
            });*/
        },TIME_SLICE);
    }

    document.ontouchmove = function(e){
        var target = e.target;
        while(target) {
            if($(target).hasClass("scrollable"))
                return;
            target = target.parentNode;
        }
        e.preventDefault();
    }

    window.startGame = function(){
        $("body .main-window-wrapper").empty();
        initGameStatus();

        window.map = initMap();
        window.getMapBlock = function(x,y){
            if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
                return map[x][y];
            }
            return null;
        }

        hero = new Model.Hero();
        heroView = new View.HeroView({model:hero});
        renderMap();
        mapEl.append(heroView.render().$el);

        heroStatusView = new View.HeroStatusView({el:$(".hero-status"), model:hero})
        heroStatusView.render();

        initSkillPool();

        initUnlock();

        heroView.renderSkillList();

        initEvent();

        var block = map[hero.get("position").x][hero.get("position").y];
        block.type = "hero";
        block.model = hero;
        block.view = heroView;

        var json = localStorage.getItem("statistic")
        if ( json )
            window.statistic = JSON.parse(json);
        else
            window.statistic = {
                kill:{
                    total:0,
                    monsterCount:{},
                    monsterLevel:{}
                },
                killed:{
                    total:0,
                    byPoison:0,
                    byFull:0,
                    byMonsters:{}
                },
                skills:{},
                most:{
                    level:1,
                    hp:1
                },
                items:{
                    total:0
                }
            }

        setTimeout(generateMonster, TIME_SLICE);
    }

    require("./preload").preload(function(){
        $("body").append("<div class='main-window-wrapper'></div>")
        window.blockSize = calculateBlockSize();

        startGame();
    })
});
