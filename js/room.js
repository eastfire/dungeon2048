define(function(require,exports,module) {
    var View = require("./view");
    var Model = require("./datamodel");
    var Help = require("./help");
    var Skill = require("./skill");
    var HelpView = Help.HelpView;

    exports.Room = Backbone.Model.extend({
        defaults:function(){
            return {
                x:0,
                y:0,
                size: 5,
                title:"",
                flavorDescription:"",

                winCondition:{
                    type:null, //null, turn, kill, move, levelUp
                    turn: null,
                    kill: null,
                    move: null,
                    levelUp: null
                },
                loseCondition:{
                    type:null, //null, turn, kill, move, levelUp
                    turn: null,
                    kill: null,
                    move: null,
                    levelUp: null
                },

                rewardDescription:null,
                punishDescription:null,

                blocks:[],
                heroAppearPosition:{
                    x:2,
                    y:2
                },
                heroAppearDirection:2,
                monsterWaveChangeEachTurn : 0, // 0 = no change
                monsterLevelPoolChangeEachTurn: 0, // 0 = no change
                bossAppearEachTurn: 0, //0 = no appear
                bossAppearOffset: 0,

                monsterPool:["archer","gargoyle","ghost","goblin","golem","kobold","medusa","mimic","minotaur","mummy","ogre","orc","rat-man","shaman","skeleton","slime","snake","troll","vampire"],
                bossPool:["boss-beholder","boss-death","boss-hydra","boss-lich"],
                initLevelPool:[1],
                initMonsterTypes:null,
                generateMonsterPerTurn : 2, // 0 = no appear
                dropItemPerLevel: TREASURE_HUNTING_EFFECT,

                specialCondition:{}, // noExp, noHp, noItem, noLevel ,hideAll, hideWinCondition, hideLoseCondition, hideReward, hidePunish
                preCondition: null,
                reward:null,

                status: "unknown" //unvisited, passed, visited, unknown
            }
        },
        getTitle:function(){
            if ( this.get("specialCondition").hideAll )
                return "未知的房间";
            return this.get("title")
        },
        getObjectContent:function(){
            var str = this.get("flavorDescription");

            var condition = this.get("winCondition");
            if ( condition && condition.type ) {
                str += "<br/>成功条件："
                if ( this.get("specialCondition")["hideAll"] || this.get("specialCondition")["hideWinCondition"] ) {
                    str += "??未知??"
                } else {
                    if (condition.type == "turn") {
                        str += "生存" + condition.turn + "回合"
                    } else if (condition.type == "kill") {
                        str += "杀死";
                        var target = condition.kill;
                        str += target.count + "个"
                        if (target.level) {
                            str += "至少lv" + target.level;
                        }
                        if ( target.monster )
                            str += Help.monsterDisplayName[target.monster];
                        else
                            str += "怪物";
                    } else if (condition.type == "get") {
                        str += "获得";
                        var target = condition.get;
                        str += target.count + "个"
                        if (target.level) {
                            str += "至少lv" + target.level;
                        }
                        if ( target.item )
                            str += Help.itemDisplayName[target.item];
                        else
                            str += "宝物";
                    } else if (condition.type == "levelUp") {
                        str += "升"+condition.levelUp+"级"
                    } else if (condition.type == "death") {
                        str += "英雄死亡"
                    } else if (condition.type == "move") {
                        str += "英雄";
                        if ( condition.move.total ) {
                            str+="移动"+condition.move.total+"格";
                        } else if ( condition.move["0"] ) {
                            str+="向上移动"+condition.move["0"]+"格";
                        } else if ( condition.move["1"] ) {
                            str+="向右移动"+condition.move["1"]+"格";
                        } else if ( condition.move["2"] ) {
                            str+="向下移动"+condition.move["2"]+"格";
                        } else if ( condition.move["3"] ) {
                            str+="向左移动"+condition.move["3"]+"格";
                        }
                    } else if (condition.type == "takeDamage") {
                        str += "英雄受到"+condition.takeDamage+"伤害";
                    }
                }
            }

            condition = this.get("loseCondition");
            if ( condition && condition.type ) {
                str += "<br/>失败条件："
                if ( this.get("specialCondition")["hideAll"] || this.get("specialCondition")["hideLoseCondition"] ) {
                    str += "??未知??"
                } else {
                    if (condition.type == "turn") {
                        str += "超过" + condition.turn + "回合"
                    } else if (condition.type == "kill") {
                        str += "杀死";
                        var target = condition.kill;
                        str += target.count + "个"
                        if (target.level) {
                            str += "至少lv" + target.level;
                        }
                        if ( target.monster )
                            str += Help.monsterDisplayName[target.monster];
                        else
                            str += "怪物";
                    } else if (condition.type == "get") {
                        str += "获得";
                        var target = condition.get;
                        str += target.count + "个"
                        if (target.level) {
                            str += "至少lv" + target.level;
                        }
                        if ( target.item )
                            str += Help.itemDisplayName[target.item];
                        else
                            str += "宝物";
                    } else if (condition.type == "levelUp") {
                        str += "英雄升"+condition.levelUp+"级"
                    } else if (condition.type == "move") {
                        str += "英雄";
                        if ( condition.move.total ) {
                            str+="移动"+condition.move.total+"格";
                        } else if ( condition.move["0"] ) {
                            str+="向上移动"+condition.move["0"]+"格";
                        } else if ( condition.move["1"] ) {
                            str+="向右移动"+condition.move["1"]+"格";
                        } else if ( condition.move["2"] ) {
                            str+="向下移动"+condition.move["2"]+"格";
                        } else if ( condition.move["3"] ) {
                            str+="向左移动"+condition.move["3"]+"格";
                        }
                    } else if (condition.type == "takeDamage") {
                        str += "英雄受到"+condition.takeDamage+"伤害";
                    }
                }
            }

            return str;
        },
        extraMonsterNumberWhenNagative:function(){
            return gameStatus.heroSkipAttackCount;
        }
    })

    window.getMapBlock = function(x,y){
        if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
            return map[x][y];
        }
        return null;
    }

    var returnUserInput = function(result){
        window.askContext.callback.call(askContext.context, result, askContext.params);
        gameStatus.phase = askContext.prevPhase;
    }

    var isDirectionInputValid = function(){
        return !showingDialog && (gameStatus.phase == PHASE_USER || gameStatus.phase == PHASE_ASK_DIRECTION );
    }

    exports.RoomView = Backbone.View.extend({
        initGameStatus : function(options) {
            window.gameStatus = {
                phase: PHASE_GENERATE,
                turn: 0,
                heroSkipAttackCount:0,
                globalEffect:{},
                maxMonsterTypeNumber:4,
                monsterPool:this.model.get("monsterPool"),
                currentMonsterTypes: this.model.get("initMonsterTypes") || getRandomItems(this.model.get("monsterPool"), 4) ,
                currentMonsterLevels:this.model.get("initLevelPool") || [1],
                currentMonsterMaxLevel : 1,
                bossPool:this.model.get("bossPool"),
                dropItemPerLevel: this.model.get("dropItemPerLevel"),
                currentItemTypes: this.model.get("initItemTypes") || ["potion","mana-potion"],
                help:{
                },
                monsterPower:{
                    freeze:8,
                    dodge:6,
                    dizzy:10,
                    lock:10,
                    curse: 8,
                    disturb:8
                },
                gainStar:0,
                win: this.model.get("status") == "passed"
            };
        },

        showObject:function(callback){
            if ( this.model.get("specialCondition").hideAll ) {
                if ( callback )
                    callback.call();
                return;
            }

            this.showRoomSign(callback)
        },
        showRoomSign:function(callback){
            showingDialog = true;
            var el = $("<div class='room-object-dialog'><div class='room-title'>"+room.getTitle()+"</div><div class='room-description'>"+room.getObjectContent()+"</div><label class='close-help'>&gt;&gt;点击（任意键）继续&lt;&lt;</button></div>");
            $(".main-window").append(el);
            el.on("click",function(){
                showingDialog = false;
                $(".room-object-dialog").remove();
                if ( callback )
                    callback.call();
            })
        },

        render : function () {
            this.$el.addClass("size"+this.model.get("size"));

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

            if ( windowOriention == "portrait") {
                $(".main-window").css({
                    width:mapWidth*blockSize.width,
                    "margin-left":(winW-roomWidth)/2
                })
            } else {
                $(".main-window").css({
                    height:mapHeight*blockSize.height,
                    "margin-top":(winH-roomHeight)/2
                })
            }
            this.$el.empty();
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    var mapBlock = renderMapBlock(map[i][j]);
                    mapBlock.attr({
                        x:i,
                        y:j,
                        id: "mapblock"+i+"_"+j
                    })
                    this.$el.append(mapBlock);
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

            return this;
        },

        userInputDirection : function(direction){
            if ( !isDirectionInputValid() )
                return;
            if ( gameStatus.phase == PHASE_ASK_DIRECTION ) {
                returnUserInput(direction);
            } else {
                if ( hero.get("dizzy") )
                    direction = (direction+2)%4;
                this.calMove(direction);
            }
        },

        initEvent : function(){

        },

        initMap : function(){
            var m = {};
            for ( var i = 0 ; i < mapWidth; i++){
                m[i]=[];
                for ( var j = 0 ; j < mapHeight; j++){
                    m[i][j] = {
                        type:"blank",
                        model:null,
                        view: null,
                        terrain:null,
                        x:i,
                        y:j
                    }
                }
            }

            return m;
        },

        renderMap: function(){
            _.each(this.model.get("blocks"),function(block){
                var x = block.x;
                var y = block.y;
                var terrainType = block.terrainType;
                if ( terrainType ) {
                    map[x][y].terrain=new View.TerrainView({
                        model: new Model.terrainMap[terrainType]({
                            type:terrainType,
                            position:{
                                x:x,
                                y:y
                            }
                        })
                    })
                    this.$el.append( map[x][y].terrain.render().$el )
                }

                var monsterType = block.monsterType;
                if ( monsterType ) {
                    this.createOneMonster(monsterType, x,y, block.monsterLevel || 1)
                }
            },this);
        },

        calculateBlockSize : function(){
            return {width:roomWidth/mapWidth, height:roomHeight/mapHeight};
        },

        initialize: function (options) {
            window.mapWidth = this.model.get("size");
            window.mapHeight = this.model.get("size");
            window.blockSize = this.calculateBlockSize();
            this.initEvent();
            window.map = this.initMap();
            if ( options ) {
                this.heroFrom = options.heroFrom;
            }
            if ( this.model.get("specialCondition").notInMap ) {
                $(".map-btn").hide();
            } else {
                $(".map-btn").show();
            }
        },

        start: function(){
            this.initGameStatus();
            this.initRoomStatistic();

            this.renderMap();

            if ( this.model.get("specialCondition").fixPosition || !this.heroFrom ) {
                hero.set({
                    "position": this.model.get("heroAppearPosition"),
                    "direction": this.model.get("heroAppearDirection")
                });
            } else {
                var x,y;
                var heroFromDirection = this.heroFrom.direction;
                if ( heroFromDirection == 0 ) {
                    y = 0;
                    x = Math.min( this.heroFrom.offset, window.mapWidth - 1 );
                } else if ( heroFromDirection == 2 ) {
                    y = window.mapHeight-1;
                    x = Math.min( this.heroFrom.offset, window.mapWidth - 1 );
                } else if ( heroFromDirection == 1 ) {
                    x = window.mapWidth-1;;
                    y = Math.min( this.heroFrom.offset, window.mapHeight - 1 );
                } else if ( heroFromDirection == 3 ) {
                    x = 0;
                    y = Math.min( this.heroFrom.offset, window.mapHeight - 1 );
                }
                hero.set({
                    position: {
                        x:x,
                        y:y
                    },
                    direction:(2+heroFromDirection)%4
                })
            }

            var block = map[hero.get("position").x][hero.get("position").y];
            block.type = "hero";
            block.model = hero;
            block.view = heroView;

            if ( this.model.get("status")==="unvisited" )
                this.model.set("status", "visited");

            this.$el.append(heroView.render().$el);

            this.renderExit();

            var self = this;
            setTimeout(function(){
                self.newTurn.call(self)
            }, TIME_SLICE);

            gameStatistic.roomCount ++;
        },

        checkDropItem : function(x,y, monsterLevel){
            if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
                if ( Math.random() > gameStatus.dropItemPerLevel*(monsterLevel+hero.get("treasureHunting"))/100 )
                    return;

                this.createItem(x,y,1);
            }
        },
        createItem:function(x,y, itemLevel, type){
            var block = map[x][y];
            block.type = "item";
            block.model = new Model.Item({
                type: type || getRandomItem(gameStatus.currentItemTypes),
                position:{
                    x: x,
                    y: y
                },
                level: itemLevel
            });
            var itemView = new View.ItemView({model:block.model});
            this.$el.append(itemView.render().$el);

            block.view = itemView;
        },

        calMonsterWave: function(){
            var monsterType = "";
            do {
                monsterType = getRandomItem(gameStatus.monsterPool)
            } while ( isInArray(gameStatus.currentMonsterTypes, monsterType) )
            if ( gameStatus.maxMonsterTypeNumber > gameStatus.currentMonsterTypes.length ){
                //add a monster
                gameStatus.currentMonsterTypes.unshift( monsterType )
            } else {
                //replace a monster
                gameStatus.currentMonsterTypes.pop();
                gameStatus.currentMonsterTypes.unshift( monsterType )
            }
        },

        calMonsterLevel : function(){
            gameStatus.currentMonsterMaxLevel ++;
            gameStatus.currentMonsterLevels = [];
            for ( var i = 1; i <= gameStatus.currentMonsterMaxLevel; i++) {
                for (var j = 0; j < i; j++){
                    gameStatus.currentMonsterLevels.push(gameStatus.currentMonsterMaxLevel-i+1);
                }
            }
        },

        checkShowHelp: function(monsterType){
            if ( !gameModeStatus.tutorial.on && !gameModeStatus.help[monsterType] ) {
                gameModeStatus.help[monsterType] = true;
                (function(monsterType) {
                    setTimeout(function () {
                        var description = Help.monsterDisplayName[monsterType] + "<br/>" + Help.monsterDescription[monsterType].text;
                        var view = new HelpView({text: description, imageClass: Help.monsterDescription[monsterType].imageClass});
                        view.show();
                    }, TIME_SLICE );
                })(monsterType);
            }
        },

        generateBoss : function(){
            if ( this.checkAllFarFill() )
                return false;
            var x;
            var y;
            do {
                x = Math.floor(Math.random()*window.mapWidth);
                y = Math.floor(Math.random()*window.mapHeight);
            } while ( map[x][y].type != "blank" || hero.isPositionNear(x,y) || (map[x][y].terrain && !map[x][y].terrain.canGenerateIn()));

            var monsterType = getRandomItem(gameStatus.bossPool);
            this.createOneMonster(monsterType, x,y, 1);

            this.checkShowHelp(monsterType)
            return true;
        },

        generateOneMonster : function(){
            if ( this.checkAllFill() )
                return;

            var x;
            var y;
            do {
                x = Math.floor(Math.random()*window.mapWidth);
                y = Math.floor(Math.random()*window.mapHeight);
            } while ( map[x][y].type != "blank" || (map[x][y].terrain && !map[x][y].terrain.canGenerateIn()) );

            var monsterType = getRandomItem(gameStatus.currentMonsterTypes);

            this.createOneMonster(monsterType, x,y);

            this.checkShowHelp(monsterType)
        },

        createOneMonster : function(monsterType, x, y, level){
            var block = map[x][y];
            block.type = "monster";
            var TempView = View.ViewMap[monsterType]
            var TempModel = Model.ModelMap[monsterType]
            var m = new TempModel({
                type:monsterType,
                level:level || getRandomItem(gameStatus.currentMonsterLevels),
                position:{
                    x: x,
                    y: y
                }
            })
            block.model = m;
            var monsterView = new TempView({model:m});
            this.$el.append(monsterView.generate().$el);

            block.view = monsterView;
            /*setTimeout(function(){
             monsterView.onGenerate.call(monsterView);
             },10)*/
        },

        newTurn: function(){
            gameStatus.phase = PHASE_TURN_START;
            gameStatus.turn ++;

            window.gameStatistic.turn ++;

            if ( this.model.get("monsterWaveChangeEachTurn") ) {
                if ( gameStatus.turn % this.model.get("monsterWaveChangeEachTurn") == 0 ) {
                    this.calMonsterWave();
                }
            }
            if ( this.model.get("monsterLevelPoolChangeEachTurn") ) {
                if ( gameStatus.turn % this.model.get("monsterLevelPoolChangeEachTurn") == 0 ) {
                    this.calMonsterLevel();
                }
            }

            $(".game-turn").html(gameStatus.turn+"回合");

            for (var i = 0; i < mapWidth; i++) {
                for (var j = 0; j < mapHeight; j++) {
                    var m = map[i][j];
                    if (m.view instanceof View.MonsterView) {
                        m.view.onNewTurn.call(m);
                    }
                }
            }
            window.heroView.onNewTurn();

            this.generateMonster();
        },

        generateMonster : function() {
            gameStatus.phase = PHASE_GENERATE;
            if ( gameStatus.win || gameStatus.lose ) {
                gameStatus.phase = PHASE_USER;
                return;
            }
            var generateMonsterCount = this.model.get("generateMonsterPerTurn") + this.model.extraMonsterNumberWhenNagative();
            _.each(heroView.skillList, function(skill){
                if ( skill.adjustGenerateMonsterCount ){
                    generateMonsterCount = skill.adjustGenerateMonsterCount.call(skill, generateMonsterCount);
                }
            });
            for (var i = 0; i < generateMonsterCount ; i++) {
                this.generateOneMonster();
            }

            setTimeout(function(){
                gameStatus.phase = PHASE_USER;
            },TIME_SLICE*5/4);
        },

        checkAllFill : function(){
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    if ( map[i][j].type == "blank" ) {
                        if ( map[i][j].terrain ) {
                            if ( map[i][j].terrain.canGenerateIn() )
                                return false;
                        } else
                            return false;
                    }
                }
            }
            return true;
        },

        checkAllFarFill : function(){
            var hx = hero.get("position").x;
            var hy = hero.get("position").y;
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    if ( map[i][j].type == "blank" && !hero.isPositionNear(i,j) )
                        return false;
                }
            }
            return true;
        },

        getFreeSpaceCount : function(){
            var count = 0;
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    if ( map[i][j].type == "blank" )
                        count++;
                }
            }
            return count;
        },

        calMapBlock : function(mapblock, direction){
            var curx = mapblock.x;
            var cury = mapblock.y;
            var movement = 0;
            var mytype = mapblock.type;
            if ( mytype == "blank" )
                return;

            var mymodel = mapblock.model;

            if (!mapblock.view.canMove()) {
                mapblock.movement = 0;
                return;
            }
            do {
                curx += increment[direction].x;
                cury += increment[direction].y;
                if ( curx >= mapWidth || cury >= mapHeight || curx < 0 || cury < 0 )
                    break;
                var curblock = window.map[curx][cury];
                if ( curblock.terrain ){
                    if ( !curblock.terrain.canPass() ) {
                        break;
                    }
                }
                if ( curblock.type == "blank" ) {
                    movement ++;
                } else if ( mytype == curblock.type ){
                    if ( mymodel.get("type") == curblock.model.get("type") ) {
                        if ( curblock.terrain && curblock.terrain.canCatch() && curblock.movement!=0) {
                            //cant merge in trap if other is moving
                            break;
                        }
                        //can merge
                        movement += (curblock.movement + 1);
                        if ( curblock.beTaken ) {
                            mapblock.beTaken = true;
                            break;
                        }
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
                } else if ( (mytype == "item" && mymodel.get("canBeTaken") && curblock.type == "hero") ||
                    ( mytype == "hero" && curblock.type == "item" && curblock.model.get("canBeTaken") )) {
                    //can take
                    movement += (curblock.movement + 1);
                    if ( curblock.type == "hero" ) {
                        mapblock.beTaken = true;
                    }
                    break;
                }else if ( mytype != curblock.type ) {
                    movement += curblock.movement;
                    break;
                }

                if ( curblock.terrain && curblock.terrain.canCatch() ) {
                    break;
                }
            } while ( true );

            mapblock.movement = movement;
            //if ( movement > 0 )
            //    console.log(mytype+" x:"+mapblock.x + " y:"+mapblock.y+ " move"+direction+":"+mapblock.movement);
        },

        calMove : function(direction) {
            var x = hero.get("position").x;
            var y = hero.get("position").y;
            if ( $("#mapblock"+x+"_"+y).find(".exit-arrow"+direction).length ) {
                this.exitRoom(direction);
                return;
            }
            window.moveDirection = direction;
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    var m = map[i][j];
                    m.movement = 0;
                    m.merge = false;
                    m.mergeTo = null;
                    m.mergeToView = null;
                    m.beTaken = false;
                }
            }

            switch (direction){
                case 0:
                    for ( var j = 1; j < mapHeight; j++  ){
                        for ( var i = 0; i < mapWidth; i++) {
                            this.calMapBlock(map[i][j], direction);
                        }
                    }
                    break;
                case 1:
                    for ( var i = mapWidth-2; i >= 0; i--  ){
                        for ( var j = 0; j < mapHeight; j++) {
                            this.calMapBlock(map[i][j], direction);
                        }
                    }
                    break;
                case 2:
                    for ( var j = mapHeight-2; j >= 0; j--  ){
                        for ( var i = 0; i < mapWidth; i++) {
                            this.calMapBlock(map[i][j], direction);
                        }
                    }
                    break;
                case 3:
                    for ( var i = 1; i < mapWidth; i++  ){
                        for ( var j = 0; j < mapHeight; j++) {
                            this.calMapBlock(map[i][j], direction);
                        }
                    }
                    break;
            }
            this.startMove(window.moveDirection);
        },

        exitRoom:function(direction){
            var offset ;
            if ( direction == 0 || direction == 2 )
                offset = hero.get("position").x;
            else offset = hero.get("position").y;
            heroView.moveEffect(1,direction,function(){
                var status;
                if ( gameStatus.win )
                    status = "win"
                else if ( gameStatus.lose )
                    status = "lose"
                else
                    status = "normal"
                window.gotoRoom( this.model.get(status+"Exit"+direction ) , {
                    direction: (2+direction)%4,
                    offset:offset
                });
            },this)
        },

        startMove : function(direction){
            gameStatus.phase = PHASE_MOVE;
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
            var self = this;
            setTimeout(function(){
                self.beforeHeroAttack.call(self);
            },maxMovement*TIME_SLICE+10);
        },

        beforeHeroAttack : function(){
            gameStatus.phase = PHASE_BEFORE_HERO_TAKE_ITEM;
            var pass = true;
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    var block = map[i][j];
                    if ( block.terrain && block.terrain.onBeforeHeroAttack ) {
                        var ret = block.terrain.onBeforeHeroAttack.call( block.terrain, block );
                        if ( pass )
                            pass = ret;
                    }
                    if ( block.type == "monster" && block.view.onBeforeHeroTakeItem ){
                        var ret = block.view.onBeforeHeroTakeItem.call(block.view);
                        if ( pass )
                            pass = ret;
                    }
                }
            }
            var self = this;
            setTimeout(function(){
                self.heroAttack.call(self);
            },pass ? 1 : 2*TIME_SLICE+10);
        },

        heroAttack : function(){
            gameStatus.phase = PHASE_HERO_ATTACK;
            var direction = window.moveDirection;
            window.prevLevel = hero.get("level");
            var willAttack = heroView.attack(direction);
            if ( willAttack ) {
                gameStatus.heroSkipAttackCount = 0;
            } else {
                gameStatus.heroSkipAttackCount++;
            }

            var self = this;
            var waitForMonsterAttack = function(){
                if ( gameStatus.phase == PHASE_MONSTER_ATTACK && !showingDialog ){
                    self.monsterAttack.call(self);
                } else {
                    setTimeout(waitForMonsterAttack, TIME_SLICE+10)
                }
            }

            setTimeout(function(){
                gameStatus.phase = PHASE_MONSTER_ATTACK;
                waitForMonsterAttack();
            },willAttack ? 4*TIME_SLICE+10 : 10);
        },

        monsterAttack : function(){
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    var block = map[i][j];
                    if ( block.type == "monster" ){
                        block.view.attack();
                    }
                }
            }
            var self = this;
            setTimeout(function(){
                if ( gameStatus.phase != PHASE_GAME_OVER )
                    self.beforeTurnEnd.call(self);
            },TIME_SLICE*2+10);
        },

        beforeTurnEnd:function(){
            var pass = true;
            for ( var i = 0 ; i < mapWidth; i++){
                for ( var j = 0 ; j < mapHeight; j++){
                    var block = map[i][j];
                    if ( block.terrain && block.terrain.onBeforeTurnEnd ) {
                        var ret = block.terrain.onBeforeTurnEnd.call( block.terrain, block );
                        if ( pass )
                            pass = ret;
                    }
                }
            }
            var self = this;
            setTimeout(function(){
                self.turnEnd.call(self);
            },pass ? 1 : 2*TIME_SLICE+10);
        },

        turnEnd : function(){
            if ( !gameStatus.win && !gameStatus.lose ) {
                if ( this.checkCondition(this.model.get("loseCondition")) ) {
                    this.lose();
                    return;
                }
                if ( this.checkCondition(this.model.get("winCondition")) ) {
                    this.win();
                    return;
                }
            }

            if ( this.checkAllFill() ) {
                gameStatus.killBy={
                    type:"full"
                }
                window.gameOver();
                return;
            }


            this.newTurn();

            if ( this.model.get("bossAppearEachTurn") && gameStatus.bossPool && gameStatus.bossPool.length ) {
                if ((gameStatus.turn + this.model.get("bossAppearOffset")) % this.model.get("bossAppearEachTurn") == 0 || gameStatus.tryingToGenerateBoss) {
                    gameStatus.tryingToGenerateBoss = true;
                    var success = this.generateBoss();
                    if (success) {
                        gameStatus.tryingToGenerateBoss = false;
                    }
                }
            }
        },

        getStatisticAboveLevelCount:function(level, levelStatistic){
            var total = 0;
            for ( var key in levelStatistic ) {
                if ( key >= level ) {
                    total += levelStatistic[key];
                }
            }
            return total;
        },

        checkCondition:function(condition){
            if (condition.type=="turn") {
                if (gameStatus.turn >= condition.turn) {
                    return true;
                }
            } else if ( condition.type == "kill" ){
                var target = condition.kill;
                if ( target.monster ) { //指明某种怪物
                    if ( target.level ) { //指明怪物等级
                        if ( this.roomStatistic.kill.type[target.monster] &&
                            this.getStatisticAboveLevelCount(target.level, this.roomStatistic.kill.type[target.monster].level ) >= target.count ) {
                            return true;
                        }
                    } else { //任意等级
                        if ( this.roomStatistic.kill.type[target.monster] &&
                            this.roomStatistic.kill.type[target.monster].total >= target.count ) {
                            return true;
                        }
                    }
                } else {//任意怪物
                    if ( this.roomStatistic.kill.total >= target.count )
                        return true;
                }
            } else if ( condition.type == "get" ){
                var target = condition.get;
                if ( target.item ) { //指明某种宝物
                    if ( target.level ) { //指明宝物等级
                        if ( this.roomStatistic.item.type[target.item] &&
                            this.getStatisticAboveLevelCount(target.level, this.roomStatistic.item.type[target.item].level ) >= target.count ) {
                            return true;
                        }
                    } else { //任意等级
                        if ( this.roomStatistic.item.type[target.item] &&
                            this.roomStatistic.item.type[target.item].total >= target.count ) {
                            return true;
                        }
                    }
                } else {//任意怪物
                    if ( this.roomStatistic.item.total >= target.count )
                        return true;
                }
            } else if ( condition.type == "move" ){
                if ( condition.move.total ) {
                    if ( this.roomStatistic.hero.move.total >= condition.move.total)
                        return true;
                } else if ( condition.move["0"] ) {
                    if ( this.roomStatistic.hero.move["0"] >= condition.move["0"])
                        return true;
                } else if ( condition.move["1"] ) {
                    if ( this.roomStatistic.hero.move["1"] >= condition.move["1"])
                        return true;
                } else if ( condition.move["2"] ) {
                    if ( this.roomStatistic.hero.move["2"] >= condition.move["2"])
                        return true;
                } else if ( condition.move["3"] ) {
                    if ( this.roomStatistic.hero.move["3"] >= condition.move["3"])
                        return true;
                }
            } else if ( condition.type == "takeDamage") {
                if ( this.roomStatistic.hero.takeDamage >= condition.takeDamage)
                    return true;
            } else if ( condition.type == "levelUp") {
                if ( this.roomStatistic.hero.levelUp >= condition.levelUp)
                    return true;
            }
            return false;
        },

        win: function(){
            gameStatus.win = true;
            this.model.set("status","passed");
            this.$el.append("<div class='room-result-sign'>成功</div>");
            this.$(".room-result-sign").css({top:"-100%","line-height":roomHeight+"px"})
            var self = this;
            setTimeout(function(){
                $(".room-result-sign").css({top:"0%","line-height":roomHeight+"px"})
                setTimeout(function(){
                    $(".room-result-sign").css({top:"100%"})
                },1500)
                setTimeout(function(){
                    gameStatus.phase = PHASE_USER;
                    $(".room-result-sign").remove()
                    self.renderExit();
                },2000)
            },10)
        },

        renderExit:function(){
            $(".exit-arrow").remove();

            var status;
            if ( gameStatus.win )
                status = "win"
            else if ( gameStatus.lose )
                status = "lose";
            else status = "normal";

            var knowNextRoom = function( exit ){
                if ( exit instanceof exports.Room ){
                } else {
                    exit = window.getRoomByPosition(exit[0],exit[1])
                }
                if ( exit.get("status") == "unknown" )
                    exit.set("status","unvisited")
            }

            if ( this.model.get(status+"Exit0") ) {
                for ( var i = 0 ; i < mapWidth; i++){
                    $("#mapblock"+i+"_"+0).append("<div class='exit-arrow exit-arrow0'></div>")
                }
                knowNextRoom(this.model.get(status+"Exit0"));
            }
            if ( this.model.get(status+"Exit1") ) {
                for ( var i = 0 ; i < mapHeight; i++){
                    $("#mapblock"+(mapWidth-1)+"_"+i).append("<div class='exit-arrow exit-arrow1'></div>")
                }
                knowNextRoom(this.model.get(status+"Exit1"));
            }
            if ( this.model.get(status+"Exit2") ) {
                for ( var i = 0 ; i < mapWidth; i++){
                    $("#mapblock"+i+"_"+(mapHeight-1)).append("<div class='exit-arrow exit-arrow2'></div>")
                }
                knowNextRoom(this.model.get(status+"Exit2"));
            }
            if ( this.model.get(status+"Exit3") ) {
                for ( var i = 0 ; i < mapHeight; i++){
                    $("#mapblock"+0+"_"+i).append("<div class='exit-arrow exit-arrow3'></div>")
                }
                knowNextRoom(this.model.get(status+"Exit3"));
            }
        },

        lose: function(){
            gameStatus.lose = true;
            this.$el.append("<div class='room-result-sign'>失败</div>");
            this.$(".room-result-sign").css({top:"-100%","line-height":roomHeight+"px"})
            var self = this;
            setTimeout(function(){
                $(".room-result-sign").css({top:"0%","line-height":roomHeight+"px"})
                setTimeout(function(){
                    $(".room-result-sign").css({top:"100%"})
                },2000)
                setTimeout(function(){
                    gameStatus.phase = PHASE_USER;
                    $(".room-result-sign").remove()
                    self.renderExit();
                },2500)
            },10)
        },

        initRoomStatistic : function(){
            this.roomStatistic = {
                kill:{
                    total:0,
                    type:{}
                },
                hero:{
                    takeDamage: 0,
                    levelUp: 0,
                    move: {
                        total: 0,
                        "0" : 0,
                        "1" : 0,
                        "2" : 0,
                        "3" : 0
                    }
                },
                item:{
                    total:0,
                    type:{}
                }
            }
        }
    });

    exports.TutorialRoom = exports.Room.extend({
        defaults:function(){
            var data = exports.Room.prototype.defaults.call(this);
            data.initMonsterTypes=["slime"];
            data.title = "新手教室";
            data.flavorDescription = "胜利条件：完成教程";
            data.winCondition = {
                type:"turn",
                turn: 6
            };
            data.dropItemPerLevel = 0;
            data.generateMonsterPerTurn = 0;
            return data;
        }
    })
    exports.TutorialRoomView = exports.RoomView.extend({
        initialize:function(){
            exports.RoomView.prototype.initialize.call(this);
            this.step = 0;
        },
        generateMonster : function() {
            gameStatus.phase = PHASE_GENERATE;
            if (this.step == 0) {
                this.createOneMonster("slime", 3, 2);
            } else if (this.step == 1) {
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
                this.createOneMonster("slime", mx, my);
            } else if (this.step == 2) {
                this.generateOneMonster();
            } else if (this.step == 3) {
                this.generateOneMonster();
            } else if (this.step == 4 || this.step == 5){
                this.createItem(2,2,1);
                this.generateOneMonster();
            } else {
                for (var i = 0; i < this.model.get("generateMonsterPerTurn") + this.model.extraMonsterNumberWhenNagative(); i++) {
                    this.generateOneMonster();
                }
            }

            if (this.step == 0) {
                var view = new HelpView({text: "向右滑动手指移动英雄和所有的怪物<br/>(PC上请用方向键)"});
                view.show();
            } else if (this.step == 1) {
                var view = new HelpView({text: "英雄移动完毕后会自动攻击并杀死面前的一个怪物"});
                view.show();
            } else if (this.step == 2) {
                var view = new HelpView({text: "英雄移动并攻击后，所有能攻击英雄的怪物将会攻击英雄"});
                view.show();
            } else if (this.step == 3) {
                var view = new HelpView({text: "同种类的怪物移动时会合并后升级，等级越高的怪物经验值越多，但是相应地攻击力越高<br/>等级越高的怪物死后越容易掉下宝物"});
                view.show();

            } else if ( this.step == 4 ){
                var view = new HelpView({text: "移动英雄到宝物或移动宝物到英雄都能使英雄获得宝物"});
                view.show();
            } else if ( this.step == 5 ){
                var view = new HelpView({text: "宝物也能合并，宝物的等级越高效果也越好"});
                view.show();
                gameStatus.dropItemPerLevel = 5;
                gameModeStatus.tutorial.on = false;
                localStorage.setItem("tutorial", false);
            }
            this.step++;

            setTimeout(function(){
                gameStatus.phase = PHASE_USER;
            },TIME_SLICE*5/4);
        }
    })

    var monsterByDifficultyLevel = [
        [ "goblin", "kobold", "medusa", "mimic", "skeleton", "slime", "rat-man"  ],
        [ "archer", "ghost", "mummy", "orc", "shaman", "snake"],
        [ "gargoyle", "golem", "minotaur", "ogre", "troll", "vampire"]
    ]

    var bossTypes = [
        "boss-beholder","boss-death","boss-hydra","boss-lich"
    ]

    var RoomTemplate = Backbone.Model.extend({
        generateMonsterTypesByDifficulty:function(min, max, validTypes){
            var types = [];
            for ( var i = min; i <= max; i++){
                _.each( monsterByDifficultyLevel[i-1], function(monsterType){
                    if ( isInArray(validTypes, monsterType) )
                        types.push(monsterType);
                },this)
            }
            return types;
        },
        defaults:function(){
            return {
                title:"",
                description:"",
                generatedCount:0,
                minDifficulty : 1,
                maxDifficulty : 5,
                minMonsterDifficulties: [ 1 , 1, 2, 1, 2, 3 ],
                maxMonsterDifficulties: [ 1 , 2, 2, 3, 3, 3 ],
                validMonsterTypes : ["archer","gargoyle","ghost","goblin","golem","kobold","medusa","mimic","minotaur","mummy","ogre","orc","rat-man","shaman","skeleton","slime","snake","troll","vampire"],
                monsterNumbers : [3,4],
                monsterMinLevel:1,
                monsterMaxLevel:1,
                sizes:[5]
            }
        },
        generateRoom : function(difficulty){
            this.set("generatedCount",this.get("generatedCount")+1);
            var r = new exports.Room({
                title:this.get("title")+"("+this.get("generatedCount")+")",
                flavorDescription:this.get("description"),
                size:window.getRandomItem(this.get("sizes")),
                minMonsterDifficulty: this.get("minMonsterDifficulties")[difficulty >= this.get("minMonsterDifficulties").length ? this.get("minMonsterDifficulties").length-1 : difficulty-1],
                maxMonsterDifficulty: this.get("maxMonsterDifficulties")[difficulty >= this.get("maxMonsterDifficulties").length ? this.get("maxMonsterDifficulties").length-1 : difficulty-1]
            })
            r.set({
                monsterTypes : this.generateMonsterTypesByDifficulty(r.get("minMonsterDifficulty"), r.get("maxMonsterDifficulty"), this.get("validMonsterTypes"))
            })
            var monsterLevelPool = [];
            for ( var i = 0; i <= difficulty*2/3; i++ ) {
                monsterLevelPool.push(i+1)
            }
            r.set({
                initMonsterTypes:getRandomItems( r.get("monsterTypes"), getRandomItem(this.get("monsterNumbers")) ),
                initLevelPool: monsterLevelPool
            })
            return r;
        }
    })

    exports.SurviveRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"生存"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                winCondition:{
                    type:"turn",
                    turn: 15+difficulty*5
                }
            })
            return r;
        }
    })

    exports.LevelUpRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"升级"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                winCondition:{
                    type:"levelUp",
                    levelUp: 1
                }
            })
            return r;
        }
    })

    exports.SlaughterRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"杀戮"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                winCondition:{
                    type:"kill",
                    kill: {
                        count: 5+difficulty*10
                    }
                }
            })
            return r;
        }
    })

    exports.AssassinRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"刺杀"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                winCondition:{
                    type:"kill",
                    kill: {
                        count: 1,
                        monster: getRandomItem(r.get("initMonsterTypes")),
                        level: 4*difficulty+1
                    }
                }
            })
            return r;
        }
    })

    exports.TreasureRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"寻宝"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                winCondition:{
                    type:"get",
                    get: {
                        count: difficulty*2+1
                    }
                }
            })
            return r;
        }
    })

    exports.BossRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"boss的房间"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            var boss = getRandomItem(bossTypes);
            r.set({
                winCondition:{
                    type:"kill",
                    kill: {
                        count: 1,
                        monster: boss
                    }
                },
                bossAppearEachTurn: 100,
                bossAppearOffset: 94,
                bossPool:[boss]
            })
            return r;
        }
    })

    exports.TrapRoomTemplate1 = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"It's a trap!"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                size: 6,
                generateMonsterPerTurn: 4,
                blocks:[
                    {
                        x:0,
                        y:0,
                        terrainType:"trap"
                    },
                    {
                        x:1,
                        y:1,
                        terrainType:"trap"
                    },
                    {
                        x:2,
                        y:2,
                        terrainType:"trap"
                    },
                    {
                        x:3,
                        y:3,
                        terrainType:"trap"
                    },
                    {
                        x:4,
                        y:4,
                        terrainType:"trap"
                    },
                    {
                        x:5,
                        y:5,
                        terrainType:"trap"
                    },
                    {
                        x:0,
                        y:5,
                        terrainType:"trap"
                    },
                    {
                        x:1,
                        y:4,
                        terrainType:"trap"
                    },
                    {
                        x:2,
                        y:3,
                        terrainType:"trap"
                    },
                    {
                        x:3,
                        y:2,
                        terrainType:"trap"
                    },
                    {
                        x:4,
                        y:1,
                        terrainType:"trap"
                    },
                    {
                        x:5,
                        y:0,
                        terrainType:"trap"
                    }
                ],
                winCondition:{
                    type:"turn",
                    turn: 10+difficulty*5
                }
            })
            return r;
        }
    })

    exports.PillarRoomTemplate = RoomTemplate.extend({
        defaults:function(){
            return _.extend( RoomTemplate.prototype.defaults.call(this),{
                title:"广殿总局"
            } )
        },
        generateRoom:function(difficulty){
            var r = RoomTemplate.prototype.generateRoom.call(this, difficulty)
            r.set({
                size: 6,
                generateMonsterPerTurn: 2,
                blocks:[
                    {
                        x:1,
                        y:1,
                        terrainType:"pillar"
                    },
                    {
                        x:4,
                        y:4,
                        terrainType:"pillar"
                    },
                    {
                        x:1,
                        y:4,
                        terrainType:"pillar"
                    },
                    {
                        x:4,
                        y:1,
                        terrainType:"pillar"
                    }
                ],
                winCondition:{
                    type:"kill",
                    kill: {
                        count: 10+difficulty*5
                    }
                },
                loseCondition:{
                    type:"turn",
                    turn: 15+difficulty*5
                }
            })
            return r;
        }
    })

    exports.roomTemplates = [
        //new exports.TrapRoomTemplate1()
        new exports.SurviveRoomTemplate(),
        new exports.LevelUpRoomTemplate(),
        new exports.SlaughterRoomTemplate(),
        new exports.AssassinRoomTemplate(),
        new exports.TreasureRoomTemplate()
    ]

    exports.specialRoomTemplates = [
        new exports.BossRoomTemplate(),
        new exports.TrapRoomTemplate1(),
        new exports.PillarRoomTemplate()
    ]

    exports.ShapTemplate = Backbone.Model.extend({
        defaults: function () {
            return {
                way: [{ direction: 0},
                    { direction: 0},
                    { direction : 0 },
                    { direction : 1 },
                    { special:true }
                ]
            }
        }
    });

    exports.shapTemplates = [
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 0 },
                { direction : 0 },
                { direction: 0 },
                { forks:[ 0, 1, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 0 },
                { direction : 1 },
                { direction: 1 },
                { forks:[ 0, 1],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 0 },
                { direction : 3 },
                { direction : 3 },
                { forks:[ 0, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 1 },
                { direction : 1 },
                { direction : 1 },
                { forks:[ 0, 1],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 3 },
                { direction : 3 },
                { direction : 3 },
                { forks:[ 0, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 1 },
                { direction : 1 },
                { direction : 0 },
                { forks:[ 0, 1],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 0},
                { direction : 3 },
                { direction : 3 },
                { direction : 0 },
                { forks:[ 0, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 1 },
                { direction : 1 },
                { direction : 1 },
                { forks:[ 0, 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 1 },
                { direction : 0 },
                { direction : 0 },
                { forks:[ 0, 1],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 1 },
                { direction : 2 },
                { direction : 2 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 0 },
                { direction : 0 },
                { direction : 0 },
                { forks:[ 0, 1],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 2 },
                { direction : 2 },
                { direction : 2 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 2 },
                { direction : 2 },
                { direction : 1 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 1},
                { direction : 0 },
                { direction : 0 },
                { direction : 1 },
                { forks:[ 1, 0],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 2 },
                { direction : 2 },
                { direction : 2 },
                { forks:[ 1, 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 2 },
                { direction : 3 },
                { direction : 3 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 2 },
                { direction : 1 },
                { direction : 1 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 1 },
                { direction : 1 },
                { direction : 1 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 3 },
                { direction : 3 },
                { direction : 3 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 1 },
                { direction : 1 },
                { direction : 2 },
                { forks:[ 1, 2],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 2},
                { direction : 3 },
                { direction : 3 },
                { direction : 2 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 3 },
                { direction : 3 },
                { direction : 3 },
                { forks:[ 0, 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 3 },
                { direction : 0 },
                { direction : 0 },
                { forks:[ 0, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 3 },
                { direction : 2 },
                { direction : 2 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 2 },
                { direction : 2 },
                { direction : 2 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 0 },
                { direction : 0 },
                { direction : 0 },
                { forks:[ 0, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 2 },
                { direction : 2 },
                { direction : 3 },
                { forks:[ 2, 3],
                    special:true }
            ]
        }),
        new exports.ShapTemplate({
            way: [{ direction: 3},
                { direction : 0 },
                { direction : 0 },
                { direction : 3 },
                { forks:[ 0, 3 ],
                    special:true }
            ]
        })
    ]
});