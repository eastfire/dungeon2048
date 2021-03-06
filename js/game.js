define(function(require,exports,module) {
    //→←↑↓
    try {
        var appCache = window.applicationCache;

        appCache.update(); // 开始更新

        if (appCache.status == window.applicationCache.UPDATEREADY) {
            appCache.swapCache();  // 得到最新版本缓存列表，并且成功下载资源，更新缓存到最新
        }
    } catch (e) {
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
    var Race = require("./race");
    var Room = require("./room");
    var MapDialog = require("./map-dialog");

    window.GAME_VERSION = "1.0.0";

    window.PHASE_TURN_START = 0;
    window.PHASE_GENERATE = 0.5;
    window.PHASE_USER = 1;
    window.PHASE_MOVE = 2;
    window.PHASE_BEFORE_HERO_TAKE_ITEM = 2.3;
    window.PHASE_ITEM_FLY_TO_HERO = 2.4;
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

    window.basicMapWidth = 5;
    window.basicMapHeight = 5;
    window.extraBlock = 2.75;

    window.MAX_ROOM_DEPTH = 7;

    var calculateScreenSize = function(){

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
            if ( winW*basicMapWidth >= winH*(basicMapWidth+extraBlock) )
                blockW = blockH = (winH)/basicMapWidth-0.1;
            else
                blockW = blockH = (winW)/(basicMapWidth + extraBlock)-0.1;
        } else {
            window.windowOriention = "portrait";
            if ( winH*basicMapWidth >= winW*(basicMapWidth+extraBlock) )
                blockW = blockH = (winW)/basicMapWidth-0.1;
            else
                blockW = blockH = (winH)/(basicMapWidth + extraBlock)-0.1;
        }
        window.roomWidth = basicMapWidth*blockW;
        window.roomHeight = basicMapHeight*blockH;
    }

    var initEvent = function(){
        var hammertime = new Hammer($(".map-wrapper")[0]);
        hammertime.get("swipe").set({
            velocity:0.08,
            direction: Hammer.DIRECTION_ALL
        })
        hammertime.on("swipeup", function(event) {
            if ( roomView )
                roomView.userInputDirection.call(roomView, 0);
        }).on("swiperight", function(event) {
            if ( roomView )
                roomView.userInputDirection.call(roomView, 1);
        }).on("swipedown", function(event) {
            if ( roomView )
                roomView.userInputDirection.call(roomView, 2);
        }).on("swipeleft", function(event) {
            if ( roomView )
                roomView.userInputDirection.call(roomView, 3);
        });

        $(document).on("keydown",function(event) {
            var levelUpShowing = $(".levelup-body").length > 0;

            if (showingDialog) {
                if ( $(".help").length ) {
                    $(".help").trigger("click");
                    return;
                }
                if ( $(".room-object-dialog").length ) {
                    $(".room-object-dialog").trigger("click");
                    return;
                }
                if ( $(".map-dialog").length ){
                    $(".map-dialog").trigger("panByKey",event);
                    return;
                }
            }

            if ( levelUpShowing ) {
                var skillEl = $(".levelup-body .skill");
                switch(event.keyCode){
                    case 38:
                        $(skillEl[0]).trigger("click");
                        break;
                    case 40:
                        if ( skillEl.length > 1 )
                            $(skillEl[1]).trigger("click");
                        break;
                }
                return;
            }
            switch(event.keyCode){
                case 38:
                    if ( roomView )
                        roomView.userInputDirection.call(roomView, 0);
                    break;
                case 39:
                    if ( roomView )
                        roomView.userInputDirection.call(roomView, 1);
                    break;
                case 40:
                    if ( roomView )
                        roomView.userInputDirection.call(roomView, 2);
                    break;
                case 37:
                    if ( roomView )
                        roomView.userInputDirection.call(roomView, 3);
                    break;
            }
        })

        $(".map-btn").on("click",showMap);
    }

    var renderGameWindow = function(){
        $("body .main-window-wrapper").empty();
        $("body .main-window-wrapper").html(mainTemplate());
        $(".main-window").addClass(window.windowOriention);

        if ( windowOriention == "portrait") {
            $(".main-window").css({
                width:roomWidth,
                "margin-left":(winW-roomWidth)/2
            })
        } else {
            $(".main-window").css({
                height:roomHeight,
                "margin-top":(winH-roomHeight)/2
            })
        }
        appendMap();
    }

    var appendMap = function(){
        $(".map-wrapper").css({
            "font-size":roomHeight/basicMapHeight/5+"px",
            width:roomWidth,
            height:roomHeight
        })
        $(".map").css({
            "font-size":roomHeight/basicMapHeight/5+"px",
            width:roomWidth,
            height:roomHeight
        })
    }

    var generateSkillPool = function(){
        window.gameModeStatus.skillPool = Skill.getSkillPool(hero.get("type"));
    }

    window.gotoRoom = function(position, from ){
        if ( window.roomView ) {
            window.roomView.remove();
        } else {
            $(".map").remove();
        }
        window.roomView = null;
        window.room = null;
        $(".map-wrapper").append("<div class='map'></div>")
        appendMap();

        if ( position instanceof Room.Room ){
            window.room = position;
        } else
            window.room = getRoomByPosition(position[0],position[1]);
        window.roomView = new Room.RoomView({model:window.room, el:$(".map"), heroFrom:from})
        roomView.render();
        if (  room.get("status") != "passed" || room.get("specialCondition").showObjectEvenPassed ) {
            showRoomObject(function () {
                roomView.start();
            })
        } else {
            roomView.start();
        }
    }

    window.getRoomByPosition = function(x,y){
        for ( var i =0 ;i < window.rooms.length; i++){
            var r = window.rooms[i];
            if ( r.get("x") == x && r.get("y") == y )
                return r;
        }
        return null;
    }

    window.generateRoomsFromTemplate = function(shapeTemplate, rootX, rootY, prevRoom, prevExitDirection, difficulty, deep){
        var way = shapeTemplate.get("way");
        var currentX = rootX;
        var currentY = rootY;
        for ( var i =0; i < way.length; i++) {
            var existRoom = getRoomByPosition(currentX,currentY);
            if ( existRoom ) {
                if ( prevExitDirection == 0) {
                    existRoom.set({
                        winExit2:prevRoom
                    })
                    prevRoom.set({
                        winExit0:existRoom
                    })
                } else if ( prevExitDirection == 1) {
                    existRoom.set({
                        winExit3:prevRoom
                    })
                    prevRoom.set({
                        winExit1:existRoom
                    })
                } else if ( prevExitDirection == 2) {
                    existRoom.set({
                        winExit0:prevRoom
                    })
                    prevRoom.set({
                        winExit2:existRoom
                    })
                } else if ( prevExitDirection == 3) {
                    existRoom.set({
                        winExit1:prevRoom
                    })
                    prevRoom.set({
                        winExit3:existRoom
                    })
                }
                return;
            }
            var roomTemplate = getRandomItem( way[i].special ?  Room.specialRoomTemplates : Room.roomTemplates );
            if ( difficulty > roomTemplate.get("maxDifficulty"))
                difficulty = roomTemplate.get("maxDifficulty");
            if ( difficulty < roomTemplate.get("minDifficulty"))
                difficulty = roomTemplate.get("minDifficulty");
            var room = roomTemplate.generateRoom(difficulty);
            var isSpecial = way[i].special;
            room.set({
                x:currentX,
                y:currentY,
                isSpecial: isSpecial
            })
            if ( prevRoom ) {
                if ( prevExitDirection == 0) {
                    prevRoom.set({
                        winExit0: room
                    })
                    if ( isSpecial ) {
                        room.set({
                            loseExit2: prevRoom,
                            winExit2: prevRoom
                        })
                    } else {
                        room.set({
                            normalExit2: prevRoom,
                            winExit2: prevRoom
                        })
                    }
                } else if ( prevExitDirection == 1) {
                    prevRoom.set({
                        winExit1: room
                    })
                    if ( isSpecial ) {
                        room.set({
                            loseExit3: prevRoom,
                            winExit3: prevRoom
                        })
                    } else {
                        room.set({
                            normalExit3: prevRoom,
                            winExit3: prevRoom
                        })
                    }
                } else if ( prevExitDirection == 2) {
                    prevRoom.set({
                        winExit2: room
                    })
                    if ( isSpecial ) {
                        room.set({
                            loseExit0: prevRoom,
                            winExit0: prevRoom
                        })
                    } else {
                        room.set({
                            normalExit0: prevRoom,
                            winExit0: prevRoom
                        })
                    }
                } else if ( prevExitDirection == 3) {
                    prevRoom.set({
                        winExit3: room
                    })
                    if ( isSpecial ) {
                        room.set({
                            loseExit1: prevRoom,
                            winExit1: prevRoom
                        })
                    } else {
                        room.set({
                            normalExit1: prevRoom,
                            winExit1: prevRoom
                        })
                    }
                }

            }
            window.rooms.push(room);

            if ( way[i].forks && deep < MAX_ROOM_DEPTH ) {
                _.each(way[i].forks, function(fork){
                    var newx = currentX + increment[fork].x;
                    var newy = currentY + increment[fork].y;
                    var shapeTemplate;
                    do {
                        shapeTemplate = getRandomItem(Room.shapTemplates);
                    } while ( shapeTemplate.get("way")[0].direction != fork );
                    generateRoomsFromTemplate( shapeTemplate , newx, newy, room, fork, deep+1 , deep+1)
                },this)
            }

            var direction = way[i].direction;
            if ( direction != null && direction != undefined ) {
                currentX += increment[direction].x;
                currentY += increment[direction].y;
            }

            prevRoom = room;
            prevExitDirection = direction
        }
    }

    window.generateRooms = function( entryX, entryY ){
        var shapeTemplate = getRandomItem(Room.shapTemplates);
        generateRoomsFromTemplate( shapeTemplate , entryX, entryY, null, 0, 1 , 1)
    }

    window.startGame = function(){
        window.gameStatistic = {
            turn: 0,
            roomCount: 0
        }

        renderGameWindow();

        initEvent();

        Skill.initSkillPool();

        _.each(Unlock.AllUnlocks,function(unlock){
            if ( unlock.isUnlocked() && unlock.adjustSkillPool )
                unlock.adjustSkillPool.call(unlock);
        })

        var callback = function() {
            window.hero = new Model.Hero({type:gameModeStatus.selectedType, race:gameModeStatus.selectedRace});
            window.heroRace = Race.allRaces[gameModeStatus.selectedRace]
            window.heroView = new View.HeroView({model: hero});

            heroStatusView = new View.HeroStatusView({el: $(".hero-status"), model: hero})
            heroStatusView.render();

            generateSkillPool();
            heroRace.adjustSkillPool();

            _.each(Unlock.AllUnlocks, function (unlock) {
                if (unlock.isUnlocked() && unlock.adjustHero)
                    unlock.adjustHero.call(unlock);
            })
            heroRace.adjustHero()

            heroView.renderSkillList();

            $(".map-btn").show();
            $(".map-btn").width(roomWidth/5)
            $(".map-btn").height(roomHeight/5)

            //gameModeStatus.tutorial.on = true;
            window.rooms = [];

            generateRooms(0, 0);

            var endlessRoom = new Room.Room({
                title:"无尽地城",
                flavorDescription:"无回合限制",
                monsterWaveChangeEachTurn : 31,
                monsterLevelPoolChangeEachTurn: 101,
                bossAppearEachTurn: 167,
                bossAppearOffset: 50,
                size:5,
                specialCondition:{
                    notInMap:true
                }
            })
            var startRoom = new Room.Room({
                title:"起点",
                flavorDescription:"↑：冒险模式<br/>→：无尽的房间",
                generateMonsterPerTurn:0,
                specialCondition:{
                    showObjectEvenPassed : true,
                    notInMap:true
                },
                winExit0:[0,0],
                winExit1:endlessRoom,
                blocks:[
                    {
                        x:2,
                        y:2,
                        terrainType:"campfire"
                    }
                ],
                status: "passed"
            })
            if ( gameModeStatus.tutorial.on ) {
                window.roomView = new Room.TutorialRoomView({
                    model: window.room = new Room.TutorialRoom({
                        winExit0:startRoom,
                        specialCondition:{
                            notInMap:true
                        }
                    }),
                    el:$(".map")
                });
                roomView.render();
                showRoomObject(function(){
                    roomView.start();
                })
            } else {
                gotoRoom(startRoom)
            }

        }

        if ( !gameModeStatus.tutorial.on ) {
            //show select hero dialog
            var el = $("<div class='select-hero-body'><div class='select-hero-title'>请选择</div>" +
                "<div class='select-hero-race'>" +
                "<div class='btn-group select-hero-race-selector' data-toggle='buttons'></div>" +
                "<div class='hero-race-description'></div>"+
                "</div><div class='select-hero-type'></div>" +
                "<button class='btn btn-default to-menu' type='button'>主菜单</button>" +
                "</div>");
            showingDialog = true;
            $(".main-window").append(el);
            var selectTypeEl = el.find(".select-hero-type");
            var selectRaceEl = el.find(".select-hero-race-selector");
            var raceDescriptionEl = el.find(".hero-race-description")
            raceDescriptionEl.html(Help.heroRaceDescription["human"]);
            var self = this;
            _.each(gameModeStatus.allRaces, function(race){
                if ( isInArray(gameModeStatus.selectableRace,race) ) {
                    var active = race == "human"?"active":"";
                    var checked = race=="human"?"checked":"";
                    var raceEl = $('<label class="btn btn-primary '+active+'">' +
                        '<input type="radio" name="options" id="'+race+'" '+checked+'>'+ Help.heroRaceDisplayName[race]
                        + '</label>');
                    selectRaceEl.append(raceEl);
                    raceEl.on("click",function(event){
                        var target = $(event.currentTarget);
                        var race = target.find("input").attr("id")
                        raceDescriptionEl.html(Help.heroRaceDescription[race]);
                    })
                }
            },this)
            $('.btn').button()

            _.each(gameModeStatus.allTypes, function(type){
                if ( isInArray(gameModeStatus.selectableType,type) ) {
                    var typeEl = $("<div class='select-hero-type-item' name='" + type + "'>" +
                        "<div class='hero-type-image " + type + "'></div>" +
                        "<div class='hero-type-name'>" + Help.heroTypeDisplayName[type] + "</div>" +
                        "</div>")
                    selectTypeEl.append(typeEl)
                    typeEl.on("click", function (event) {
                        var target = $(event.currentTarget);
                        $(".select-hero-body").remove();
                        gameModeStatus.selectedType = target.attr("name");
                        gameModeStatus.selectedRace = selectRaceEl.find(".active").find("input").attr("id");
                        showingDialog = false;
                        callback.call(self);
                    })
                } else {
                    var typeEl = $("<div class='select-hero-type-item'>" +
                        "<div class='hero-type-image locked'></div>" +
                        "<div class='hero-type-name'>"+Help.heroTypeDisplayName[type]+"</div>" +
                        "</div>")
                    selectTypeEl.append(typeEl)
                }
            },this)

            el.find(".to-menu").on("click",function(){
                $(".select-hero-body").remove();
                gameStatus = {
                    gainStar:0,
                    death:null
                }
                var view = new ScoreBoard.GameOver();
                $(".main-window").append(view.render().$el);
            })
        } else {
            gameModeStatus.selectedType = gameModeStatus.selectableType[0]
            gameModeStatus.selectedRace = "human"
            callback.call(this);
        }
    }

    var removeSkillFromPool = function(skill){
        for ( var i = 0; i < window.gameModeStatus.skillPool.length ; i++) {
            if ( window.gameModeStatus.skillPool[i].get("name") == skill.get("name") ) {
                window.gameModeStatus.skillPool.splice(i,1);
                return;
            }
        }
    }

    var removeAllOtherActiveSkillFromPool = function(){
        var newPool = [];
        for ( var i = 0; i < window.gameModeStatus.skillPool.length ; i++) {
            var skill = window.gameModeStatus.skillPool[i];
            if ( skill.get("type") != "active" || window.heroView.hasSkill(skill)) {
                newPool.push(window.gameModeStatus.skillPool[i])
            }
        }
        window.gameModeStatus.skillPool = newPool;
    }

    window.showRoomObject = function(callback){
        roomView.showObject(callback);
    }

    window.showMap = function(){
        var view = new MapDialog.MapDialog();
        $(".main-window-wrapper").append(view.render().$el);
        view.initEvent();
        view.renderDialog();
    }

    window.showLevelUpDialog = function(callback){
        var selectableSkillNumber = hero.get("selectableSkillNumber");
        var skillArray = getRandomItems(window.gameModeStatus.skillPool,selectableSkillNumber );
        if ( skillArray == null || skillArray.length == 0 ){
            callback.call();
            return;
        }
        var el = $("<div class='levelup-body'><div class='levelup-title'>请选择升级技能</div></div>");
        showingDialog = true;
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
                if ( model.get("level") > model.get("maxLevel") ) {
                    removeSkillFromPool(model);
                }
                showingDialog = false;
                $(".levelup-body").remove();
                callback.call();
            })
        })
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

    window.increment = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

    window.gameOver = function(){
        if (gameStatus.phase == PHASE_GAME_OVER )
            return
        if ( gameStatus.killBy )
            gameStatus.death = {
                name : window.hero.get("name"),
                type : window.hero.get("type"),
                race : window.hero.get("race"),
                score : window.hero.get("score"),
                level : window.hero.get("level"),
                killBy :gameStatus.killBy,
                turn: gameStatistic.turn,
                timestamp : Firebase.ServerValue.TIMESTAMP,//(new Date()).getTime(),
                r: Math.random(),
                version: GAME_VERSION,
                roomCount: gameStatistic.roomCount - 1,
                roomName : room.get("title"),
                ".priority":window.hero.get("score")
            }
        else
            gameStatus.death = null;

        gameStatus.phase = PHASE_GAME_OVER;
        setTimeout(function(){
            roomView.remove();
            roomView = null;
            room = null;

            var view = new ScoreBoard.GameOver();
            $(".main-window").append(view.render().$el);
            $(".hero-active-skill").hide();
            $(".map-btn").hide();
        },TIME_SLICE);
    }

    var initStatistic = function(){
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
                    byMonsters:{},
                    byTrap:0
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
    }

    require("./preload").preload(function(){
        $("body").append("<div class='main-window-wrapper'></div>")
        calculateScreenSize();

        window.gameModeStatus = {
            allTypes: ["warrior", "priest", "wizard", "thief"],
            selectableType: ["warrior"],
            allRaces: ["human", "half-orc", "elf", "dwarf"],
            selectableRace: ["human", "half-orc", "elf", "dwarf"],
            tutorial:{
                on:true,
                step:0
            },
            help:{

            }
        }
        var store = localStorage.getItem("tutorial");
        if ( store != null ){
            gameModeStatus.tutorial.on = JSON.parse(store);
        }

        initStatistic();

        startGame();
    })

});