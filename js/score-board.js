define(function(require,exports,module) {
    var Help = require("./help");
    var Unlock = require("./unlock");

    exports.GameOver = Backbone.View.extend({
        events:{
            "click .restart-game":"restartGame",
            "click .to-menu":"toGameMenu"
        },
        initialize:function(options){
            var star = localStorage.getItem("player-star");
            if ( star == null )
                star = 0;
            else
                star = parseInt(star);
            localStorage.setItem("player-star", star + gameStatus.gainStar);
            window.playerModel = new Backbone.Model({
                star:localStorage.getItem("player-star")
            })

            if ( gameStatus.death) {
                if (gameStatus.death.level > statistic.most.level)
                    statistic.most.level = gameStatus.death.level;
                if (hero.get("maxHp") > statistic.most.hp)
                    statistic.most.hp = hero.get("maxHp");

                statistic.killed.total++;
                if ( gameStatus.death.killBy.type == "poison" ) {
                    statistic.killed.byPoison ++;
                } else if ( gameStatus.death.killBy.type == "full" ) {
                    statistic.killed.byFull ++;
                } else if ( gameStatus.death.killBy.type == "monster" ) {
                    var type = gameStatus.death.killBy.monsterType;
                    if ( statistic.killed.byMonsters[type] ) {
                        statistic.killed.byMonsters[type]++;
                    } else
                        statistic.killed.byMonsters[type] = 1;
                    if ( gameStatus.death.killBy.isBoss )
                        statistic.killed.byBoss = statistic.killed.byBoss ? statistic.killed.byBoss + 1 : 1;
                }
                localStorage.setItem("statistic", JSON.stringify(statistic));
            }
        },
        render:function(){
            this.$el.addClass("game-over");
            this.$el.html("<div><ul class='nav nav-tabs game-over-tabs' role='tablist'>" +
                "<li class='active'><a href='#score' role='tab' data-toggle='tab'>排名</a></li>" +
                "<li><a href='#message' role='tab' data-toggle='tab'>留言</a></li>" +
                "<li><a href='#unlock' role='tab' data-toggle='tab'>解锁</a></li>" +
                "<li><a href='#achievement' role='tab' data-toggle='tab'>成就</a></li>" +
                "<li><a href='#shop' role='tab' data-toggle='tab'>商店</a></li>" +
                "</ul>" +
                "<div class='tab-content'>" +
                "<div class='tab-pane fade in active' id='score'></div>" +
                "<div class='tab-pane fade' id='message'></div>" +
                "<div class='tab-pane fade' id='unlock'></div>" +
                "<div class='tab-pane fade' id='achievement'></div>" +
                "<div class='tab-pane fade' id='shop'>开发中……</div>" +
                "</div></div>" +
                "<p class='game-over-buttons'><button class='btn btn-primary restart-game'>再来一局</button></p>")

            var view = new exports.InputPlayerName({callback:this.onPlayerNameInput, context:this});
            this.$el.append(view.render().$el);
            return this;
        },
        onPlayerNameInput:function(){
            $(".hero-status").css("visibility","hidden");
            var scoreboardView = new exports.ScoreBoard({currentScore:gameStatus.death})
            this.$("#score").append(scoreboardView.render().$el)

            var messageView = new exports.MessageBoard()
            this.$("#message").append(messageView.render().$el)

            var unlockBoard = new exports.UnlockBoard();
            this.$("#unlock").append(unlockBoard.render().$el)

            var achievementBoard = new exports.AchievementBoard();
            this.$("#achievement").append(achievementBoard.render().$el)

            this.$('.game-over-tabs a').click(function (e) {
                e.preventDefault()
                $(this).tab('show')
            })
            setTimeout(function(){
                var h = self.$('.main-window').height() - self.$('.game-over-tabs').height() - self.$(".game-over-buttons").height();
                self.$(".score-board").height(h-25)
                self.$(".message-list").height(h-75)
                self.$(".unlock-list").height(h-75)
                self.$(".achievement-list").height(h-75)
            },100);
        },
        restartGame:function(){
            window.startGame();
        },
        toGameMenu:function(){

        }
    })

    var endingWord = [
        "英雄，虽然你死了，我们会记住你的，请输入你的名号",
        "地城深处，有一块墓碑，上面刻着死去英雄的名号",
        "一个英雄的灵魂在地城飘荡，吼着自己的名号"
    ]

    exports.InputPlayerName = Backbone.View.extend({
        events:{
            "click .confirm":"onConfirm",
            "keydown .player-name":"onKeyDown"
        },
        initialize:function(options){
            this.callback = options.callback;
            this.callbackcontext = options.context;
        },
        render:function(){
            this.$el.addClass("input-player-name");
            this.$el.html("<label class='game-over-title'>GAME OVER</label>" +
                "<lable>"+getRandomItem(endingWord)+"</lable><div class='input-group input-group-player-name'>" +
                "<input type='text' class='form-control player-name' maxlength='15'>" +
                "<span class='input-group-btn'>" +
                "<button class='btn btn-default confirm' type='button'>确定</button>"+
                "</span>" +
                "</div>");
            var store = localStorage.getItem("player-name");
            if ( store != null ){
                this.$(".player-name").val(store)
            }

            return this;
        },
        onKeyDown:function(event){
            if ( event.keyCode == 13 ) {
                this.onConfirm();
            }
        },
        onConfirm:function(event){
            var name = this.$(".player-name").val().trim();
            if ( name ) {
                localStorage.setItem("player-name", name);
                if ( gameStatus.death )
                    gameStatus.death.name = name;
                gameStatus.playerName = name;
                this.remove();
                this.callback.call(this.callbackcontext);
            }
        }
    })

    exports.ScoreBoard = Backbone.View.extend({
        initialize:function(options){
            this.scoreQuery = new Firebase("https://dungeon2048.firebaseio.com/score").endAt().limit(20);
            this.scoreRef = this.scoreQuery.ref();
            var self = this;
            this.score = null;
            this.$el.addClass("loading");
            if ( options && options.currentScore && options.currentScore.killBy ) {
                options.currentScore.version = GAME_VERSION;
                options.currentScore.agent = navigator.userAgent;
                this.score = options.currentScore;
                this.scoreRef.push(options.currentScore, function(){
                    console.log("score upload complete");
                    self.fetchScore.call(self);
                })
            } else {
                this.fetchScore.call(self);
            }
        },
        fetchScore:function(){
            var self = this;
            this.scoreQuery.once("value",function(snapshot){
                self.$el.removeClass("loading");
                self.scores = snapshot.val();
                self.renderList.call(self);
            })
        },
        render:function(){
            this.$el.html("<table class='score-list scrollable'></table>")
            this.$el.addClass("score-board");
            this.$(".scrollable").ontouchmove = function(e) {
                e.stopPropagation();
            };
            return this;
        },
        renderList:function(){
            var list = this.$(".score-list")
            list.empty();
            var self = this;
            var found = false;
            _.each( this.scores, function(score){
                if ( !score.level )
                    return;

                var current;
                if ( this.score &&  score.r == this.score.r ){
                    current = "current";
                    found = true;
                } else {
                    current = "";
                }
                var type = Help.heroTypeDisplayName[score.type];
                type = type || Help.heroTypeDisplayName["warrior"];//默认值
                var race = Help.heroRaceDisplayName[score.race];
                race = race || "原初"
                list.prepend("<tr class='score-row "+current+"'>" +
                        "<td class='score-cell player-name'>"+score.name+"</td>"+
                        "<td class='score-cell player-level'>"+"lv"+score.level+"</td>"+
                        "<td class='score-cell player-type'>"+race+type+"</td>"+
                        "<td class='score-cell player-score'>"+score.score+"分</td>"+
                        "<td class='score-cell player-kill-by'>"+self.getReason(score)+"</td>"+
                    "</tr>")
            }, this )
            if ( !found && this.score ) {
                var type = Help.heroTypeDisplayName[this.score.type];
                type = type || Help.heroTypeDisplayName["warrior"];//默认值
                var race = Help.heroRaceDisplayName[score.race];
                race = race || "原初"
                list.append("<tr class='score-row placeholder'><td><b>……</b></td><td></td></td><td></td><td></td><td></td></tr>");
                list.append("<tr class='score-row current'>" +
                    "<td class='score-cell player-name'>"+this.score.name+"</td>"+
                    "<td class='score-cell player-level'>"+"lv"+this.score.level+"</td>"+
                    "<td class='score-cell player-type'>"+race+type+"</td>"+
                    "<td class='score-cell player-score'>"+this.score.score+"分</td>"+
                    "<td class='score-cell player-kill-by'>"+self.getReason(this.score)+"</td>"+
                    "</tr>")
            }
            this.$el.animate({
                scrollTop: list.find(".score-row.current").offset().top
            })
        },
        getReason:function(score){
            var reason;
            if ( score.killBy.type == "poison" ){
                reason="死于中毒"
            } else if ( score.killBy.type == "full" ){
                reason="死于地城爆满"
            } else if ( score.killBy.type == "monster" ){
                var lvStr = "lv"+score.killBy.monsterLevel;
                if ( score.killBy.isBoss )
                    lvStr = "";
                reason="被"+lvStr+Help.monsterDisplayName[score.killBy.monsterType]+"杀死";
            }
            return reason;
        }
    })

    exports.MessageBoard = Backbone.View.extend({
        currentLimit:50,
        events:{
            "click .send":"onSend",
            "keydown .input-message":"onKeyDown"
        },
        initialize:function(options){
            this.$el.html("<div class='input-group input-group-message'>" +
                "<input type='text' class='form-control input-message' maxlength='200'>" +
                "<span class='input-group-btn'>" +
                "<button class='btn btn-default send' type='button'>发送</button>"+
                "</span>" +
                "</div>" +
                "<ul class='message-list scrollable'></ul>")
            this.$el.addClass("message-board");
            this.$(".scrollable").ontouchmove = function(e) {
                e.stopPropagation();
            };
            this.query = new Firebase("https://dungeon2048.firebaseio.com/message").endAt().limit(this.currentLimit);
            this.ref = this.query.ref();
            var self = this;
            this.query.on("value",function(snapshot){
                self.messages = snapshot.val();
                self.renderList.call(self);
            })
        },
        onKeyDown:function(event){
            if ( event.keyCode == 13 ) {
                this.onSend();
            }
        },
        onSend: function () {
            var msg = this.$(".input-message").val().trim();
            if ( msg ) {
                var self = this;
                this.ref.push({
                    name: gameStatus.playerName,
                    ".priority": Firebase.ServerValue.TIMESTAMP,
                    timestamp:Firebase.ServerValue.TIMESTAMP,
                    msg: msg
                },function(){
                    self.$(".input-message").val("");
                })
            }
        },
        renderList:function(){
            var list = this.$(".message-list")
            list.empty();
            _.each( this.messages, function(message){
                if ( message.name ) {
                    list.prepend("<li class='message'><label class='message-user-name'>" + message.name + "</label>" +
                        (message.timestamp ? ("<label class='message-time'>"+ relative_time_text(message.timestamp) +"</label>") : "") +
                        "说:<div class='message-msg'>" + message.msg + "</div></li>");
                }
            },this);
        },
        render:function(){
            return this;
        }
    })

    exports.UnlockBoard = Backbone.View.extend({
        events:{
            "click .unlock-it":"onUnlock"
        },
        initialize:function(options){
            this.$el.html("<div class='unlock-title'><span>你拥有</span></span><span class='my-star'></span><span class='star'></span></div>" +
                "<div class='unlock-list scrollable'></div>")
            this.$el.addClass("unlock-board");
            this.list = this.$(".unlock-list");
            this.$(".scrollable").ontouchmove = function(e) {
                e.stopPropagation();
            };
            this.renderList();
            window.playerModel.on("change",this.renderList,this);
        },
        render:function(){
            return this;
        },
        renderList:function(){
            this.list.empty();
            var myStar = localStorage.getItem("player-star");
            this.$(".my-star").html(myStar||0)
            _.each(Unlock.AllUnlocks, function(unlock){
                if ( unlock.isValid.call(unlock) && !unlock.isUnlocked.call(unlock) ) {
                    var el = $("<div class='unlock-item' name='"+unlock.get("name")+"'>" +
                        "<span class='unlock-icon unlock-icon-"+unlock.get("name")+"'></span>" +
                        "<span class='unlock-description'>"+unlock.get("description")+"</span>" +
                        "<button class='btn btn-success unlock-it'>"+unlock.get("cost")+"<span class='star'/></button>"+
                        "</div>")
                    this.list.append(el);
                    el.data("unlock",unlock);
                    if ( myStar < unlock.get("cost") )
                        el.find(".unlock-it").removeClass("btn-success").addClass("disabled btn-danger")
                }
            },this);
        },
        onUnlock:function(event){
            var target = $(event.currentTarget);
            var unlockItem = target.parent(".unlock-item");
            var unlock = unlockItem.data("unlock");
            var myStar = localStorage.getItem("player-star");
            unlock.unlock();
            myStar -= unlock.get("cost");
            localStorage.setItem("player-star", myStar)
            window.playerModel.set("star",myStar);
            //this.renderList();
        }
    })

    exports.AchievementBoard = Backbone.View.extend({
        events:{
            "click .get-reward":"getReward"
        },
        initialize:function(options){
            this.$el.html("<div class='unlock-title'><span>你拥有</span></span><span class='my-star'></span><span class='star'></span></div>" +
                "<div class='achievement-list scrollable'></div>")
            this.$el.addClass("achievement-board");
            this.list = this.$(".achievement-list");
            this.$(".scrollable").ontouchmove = function(e) {
                e.stopPropagation();
            };
            this.renderList();
            window.playerModel.on("change",this.renderList,this);
        },
        render:function(){
            return this;
        },
        renderList:function(){
            this.list.empty();
            var myStar = localStorage.getItem("player-star");
            this.$(".my-star").html(myStar||0)
            _.each(Unlock.AllAchievements, function(achievement){
                if ( achievement.isValid.call(achievement) ) {
                    var passed = achievement.isPassed.call(achievement)
                    if ( !passed && achievement.get("hidden") )
                        return;
                    var getButton;
                    if ( achievement.isGotten.call(achievement) ){
                        getButton = "<label class='gotten'>已获得</label>"
                    } else {
                        getButton = "<button class='btn btn-success get-reward'>获得"+achievement.get("reward")+"<span class='star'/></button>"
                    }
                    var el = $("<div class='achievement-item' name='"+achievement.get("name")+"'>" +
                        "<span class='achievement-description'><label>"+achievement.get("displayName")+"</label><br/>"+achievement.get("description")+"</span>" +
                        getButton+ "</div>")
                    this.list.append(el);
                    el.data("achievement",achievement);
                    if ( !passed )
                        el.find(".get-reward").removeClass("btn-success").addClass("disabled btn-default")
                }
            },this);
        },
        getReward:function(event){
            var target = $(event.currentTarget);
            var achievementItem = target.parent(".achievement-item");
            var achievement = achievementItem.data("achievement");
            achievement.getReward();
            window.playerModel.set("star",localStorage.getItem("player-star"));
            //this.renderList();
        }
    })
})