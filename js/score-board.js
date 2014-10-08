define(function(require,exports,module) {
    var Help = require("./help");
    exports.GameOver = Backbone.View.extend({
        events:{
            "click .restart-game":"restartGame",
            "click .to-menu":"toGameMenu"
        },
        initialize:function(options){

        },
        render:function(){
            this.$el.addClass("game-over");
            this.$el.html("<div><ul class='nav nav-tabs game-over-tabs' role='tablist'>" +
                "<li class='active'><a href='#score' role='tab' data-toggle='tab'>排行榜</a></li>" +
                "<li><a href='#message' role='tab' data-toggle='tab'>留言板</a></li>" +
                "</ul>" +
                "<div class='tab-content'>" +
                "<div class='tab-pane fade in active' id='score'></div>" +
                "<div class='tab-pane fade' id='message'></div>" +
                "</div></div>" +
                "<p class='game-over-buttons'><button class='btn btn-default to-menu'>回主菜单</button><button class='btn btn-primary restart-game'>再来一局</button></p>")

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

            this.$('.game-over-tabs a').click(function (e) {
                e.preventDefault()
                $(this).tab('show')
            })
            setTimeout(function(){
                var h = window.winH - self.$('.game-over-tabs').height() - self.$(".game-over-buttons").height() - self.$(".game-over-title").height();
                self.$(".score-board").height(h-50)
                self.$(".message-list").height(h-50-self.$(".input-group-message").height())
            },10);
        },
        restartGame:function(){
            window.startGame();
        },
        toGameMenu:function(){

        }
    })

    var endingWord = [
        "英雄，虽然你死了，我们会记住你的，请输入你的名号",
        "地城深处，有一块墓碑，上面刻着死去英雄的名号"
    ]

    exports.InputPlayerName = Backbone.View.extend({
        events:{
            "click .confirm":"onConfirm"
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
        onConfirm:function(event){
            var name = this.$(".player-name").val().trim();
            if ( name ) {
                localStorage.setItem("player-name", name);
                gameStatus.playerName = gameStatus.death.name = name;
                this.remove();
                this.callback.call(this.callbackcontext);
            }
        }
    })

    exports.ScoreBoard = Backbone.View.extend({
        initialize:function(options){
            this.scoreQuery = new Firebase("https://dungeon2048.firebaseio.com/score").endAt().limit(10);
            this.scoreRef = this.scoreQuery.ref();
            var self = this;
            if ( options && options.currentScore){
                this.$el.addClass("loading");
                this.scoreRef.push(options.currentScore, function(){
                    console.log("score upload complete");
                    self.fetchScore.call(self);
                })
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
            this.$el.html("<table class='score-list'></table>")
            this.$el.addClass("score-board");
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
                if ( score.timestamp == gameStatus.death.timestamp ){
                    current = "current";
                    found = true;
                } else {
                    current = "";
                }
                list.prepend("<tr class='score-row "+current+"'>" +
                        "<td class='score-cell player-name'>"+score.name+"</td>"+
                        "<td class='score-cell player-level'>"+"lv"+score.level+"</td>"+
                        "<td class='score-cell player-type'>"+score.type+"</td>"+
                        "<td class='score-cell player-score'>"+score.score+"分</td>"+
                        "<td class='score-cell player-kill-by'>"+self.getReason(score)+"</td>"+
                    "</tr>")
            } )
            if ( !found ) {
                list.append("<tr class='score-row placeholder'><td><b>……</b></td><td></td></td><td></td><td></td><td></td></tr>");
                list.append("<tr class='score-row current'>" +
                    "<td class='score-cell player-name'>"+gameStatus.death.name+"</td>"+
                    "<td class='score-cell player-level'>"+"lv"+gameStatus.death.level+"</td>"+
                    "<td class='score-cell player-type'>"+gameStatus.death.type+"</td>"+
                    "<td class='score-cell player-score'>"+gameStatus.death.score+"分</td>"+
                    "<td class='score-cell player-kill-by'>"+self.getReason(gameStatus.death)+"</td>"+
                    "</tr>")
            }
        },
        getReason:function(score){
            var reason;
            if ( score.killBy.type == "poison" ){
                reason="死于中毒"
            } else if ( score.killBy.type == "full" ){
                reason="死于地城爆满"
            } else if ( score.killBy.type == "monster" ){
                reason="被Lv"+score.killBy.monsterLevel+Help.monsterDisplayName[score.killBy.monsterType]+"杀死";
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
                "<ul class='message-list'></ul>")
            this.$el.addClass("message-board");
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
                    list.prepend("<li class='message'><label class='message-user-name'>" + message.name + "</label>说:<div class='message-msg'>" + message.msg + "</div></li>");
                }
            },this);
        },
        render:function(){
            return this;
        }
    })
})