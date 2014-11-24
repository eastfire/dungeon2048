define(function(require,exports,module){
    var Skill = require("./skill");
    var Help = require("./help")

    var clearMapBlock = function (x,y) {
        if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
            var block = map[x][y];
            block.model = block.view = null;
            block.type = "blank";
        }
    }

    var MovableView = Backbone.View.extend({
        initialize:function(){
            this.model.on("change:direction",this.renderDirection,this);
            this.model.on("change:freeze",this.renderFreeze,this);
        },
        moveEffect:function(movement, direction, callback, callbackContext){
            if ( movement <= 0 )
                return;
            this.model.set("direction",direction);
            var oldx = this.model.get("position").x;
            var oldy = this.model.get("position").y;
            var x1 = oldx;
            var y1 = oldy;
            for ( var i = 0 ;i < movement ; i++ ){
                x1 += increment[direction].x;
                y1 += increment[direction].y;
            }

            var x2 = x1*blockSize.width;
            var y2 = y1*blockSize.height;
            //console.log(this.model.get("type")+" move to "+x1+" "+y1);
            this.$el.css({transition: "left "+(TIME_SLICE/1000)*movement+"s ease-in-out 0s, top "+(TIME_SLICE/1000)*movement+"s ease-in-out 0s", left:x2, top:y2});
            setTimeout(function(){
                if ( callback )
                    callback.call(callbackContext)
            },10+TIME_SLICE*movement)
        },
        move:function(movement, direction){
            if ( movement <= 0 )
                return;
            this.model.set("direction",direction);
            var oldx = this.model.get("position").x;
            var oldy = this.model.get("position").y;
            var x1 = oldx;
            var y1 = oldy;
            for ( var i = 0 ;i < movement ; i++ ){
                x1 += increment[direction].x;
                y1 += increment[direction].y;
            }

            var x2 = x1*blockSize.width;
            var y2 = y1*blockSize.height;
            //console.log(this.model.get("type")+" move to "+x1+" "+y1);
            this.$el.css({transition: "left "+(TIME_SLICE/1000)*movement+"s ease-in-out 0s, top "+(TIME_SLICE/1000)*movement+"s ease-in-out 0s", left:x2, top:y2});
            clearMapBlock(oldx, oldy)
            var oldblock = map[oldx][oldy];

            var self = this;
            var newblock = map[x1][y1];
            setTimeout(function(){
                self.onMoveComplete.call(self, oldblock, newblock);
            },10+TIME_SLICE*movement)
        },
        setToPosition:function(x,y){
            var oldx = this.model.get("position").x;
            var oldy = this.model.get("position").y;

            if ( oldx == x && oldy == y )
                return;

            map[x][y].view = map[oldx][oldy].view
            map[x][y].model = map[oldx][oldy].model
            map[x][y].type = map[oldx][oldy].type

            this.model.set("position",{x:x,y:y});
            var x2 = x*blockSize.width;
            var y2 = y*blockSize.height;
            this.$el.css({transition: "", left:x2, top:y2});

            map[oldx][oldy].view = "blank"
            map[oldx][oldy].model = null;
            map[oldx][oldy].type = "blank"
        },
        render:function() {
            this.$el.css({
                position: "absolute",
                width: blockSize.width,
                height: blockSize.height,
                left: this.model.get("position").x * blockSize.width,
                top: this.model.get("position").y * blockSize.height
            }).addClass(this.model.get("type"))
            this.renderDirection();
            this.effecQueue = new EffectQueue();
            this.$el.append(this.effecQueue.render().el);
            var self = this;
            this.$el.on("click",function(){
                $("#mapblock"+self.model.get("position").x+"_"+self.model.get("position").y).click();
            })
            return this;
        },
        renderDirection:function(){
            this.$el.removeClass("d0 d1 d2 d3")
                .addClass("d"+this.model.get("direction"))
        },
        canMove:function(){
            return !this.model.get("freeze")
        },
        renderFreeze:function(){
            if ( this.model.get("freeze") && !this.model.previous("freeze")) {
                this.$el.append("<div class='status-freeze'></div>")
                this.effecQueue.add.call(this.effecQueue, "麻痹");
            } else if ( !this.model.get("freeze") && this.model.previous("freeze")) {
                this.$(".status-freeze").remove();
            }
        },
        getFreeze:function(f){
            this.model.set("freeze",f);
            return true;
        },
        onMoveComplete:function(){

        },
        remove:function(){
            this.$el.remove();
        }
    });
    exports.HeroView = MovableView.extend({
        initialize:function(){
            MovableView.prototype.initialize.call(this);
            this.model.on("change:level",this.levelUp,this);
            this.model.on("change:poison",this.renderPoison,this);
            this.model.on("change:dizzy",this.renderDizzy,this);
            this.model.on("change:locked",this.renderLocked,this);
            this.model.on("change:cursed",this.renderCursed,this);
            this.model.on("change:hp",this.checkAlive,this);
            this.skillList = [];
        },
        render:function(){
            this.$el = $("<div class='hero'></div>")
            MovableView.prototype.render.call(this);
            if ( this.model.get("poison") ) {
                this.$el.append("<div class='status-poison'>" + this.model.get("poison") + "</div>")
            }
            return this;
        },
        move:function(movement, direction){
            MovableView.prototype.move.call(this,movement,direction);
            //roomStatistic
            roomView.roomStatistic.hero.move.total += movement;
            roomView.roomStatistic.hero.move[direction] += movement;
            //roomStatistic end
        },
        getSkill:function(skill){
            var found = this.hasSkill(skill);
            if ( found ) {
                found.set("level", skill.get("level"));
            } else {
                this.skillList.push(skill.clone());
            }
            this.renderSkillList();
        },
        hasSkill:function(skill){
            var found = null;
            for ( var i = 0; i < this.skillList.length; i++) {
                if ( this.skillList[i].get("name") == skill.get("name") ){
                    found = this.skillList[i];
                    break;
                }
            }
            return found;
        },
        isSkillSlotFull:function(){
            return this.skillList.length >= this.model.get("skillSlot");
        },
        renderSkillList:function(){
            var list = $(".hero-active-skill");
            list.empty();
            var i = 0;
            for ( ;i < this.skillList.length; i++ ) {
                var view = new Skill.SkillView({model:this.skillList[i] , mode:"list"})
                list.append(view.render().$el)
            }
            for ( ; i < this.model.get("skillSlot") ; i++ ){
                var emptySlot = $("<div class='empty-skill-slot'></div>")
                emptySlot.css({
                    width: roomWidth/basicMapWidth*3/4,
                    height: roomHeight/basicMapHeight*3/4,
                    margin: roomWidth/basicMapWidth/8
                })
                list.append(emptySlot)
            }
        },
        levelUp:function(){
            //roomStatistic
            roomView.roomStatistic.hero.levelUp++;
            //roomStatistic end

            this.effecQueue.add.call(this.effecQueue,"Level Up");
        },
        onMoveComplete:function(oldblock, newblock){
            if ( newblock.type == "item" ) {
                newblock.view.beTaken();
            }
            newblock.view = this;
            newblock.type = "hero";
            newblock.model = this.model;
            this.model.set("position",{x:newblock.x,y:newblock.y});
        },
        useSkill:function(){
            var self = this;
            this.$el.addClass("skill0");
            setTimeout(function(){
                self.$el.removeClass("skill0").addClass("skill1");
            },TIME_SLICE)
            setTimeout(function(){
                self.$el.removeClass("skill1").addClass("skill2");
            },2*TIME_SLICE)
            setTimeout(function(){
                self.$el.removeClass("skill2");
            },3*TIME_SLICE)
        },
        attack:function(direction){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            x += increment[direction].x;
            y += increment[direction].y;
            var block = getMapBlock(x,y);
            var willAttack = false;
            _.each(this.skillList, function(skill){
                if ( skill.onCheckAttack ){
                    var ret = skill.onCheckAttack.call(skill, x, y, direction);
                    if ( ret )
                        willAttack = true;
                }
            },this);
            if ( block && block.type == "monster" ){
                var monsterView = block.view;
                this.$el.addClass("attacking0");
                var self = this;
                setTimeout(function(){
                    self.$el.removeClass("attacking0").addClass("attacking1");
                    var result = monsterView.beAttacked(direction,self.model.get("attack"),"melee normal");
                    if ( !result ) {
                        self.effecQueue.add.call(self.effecQueue,"Miss!");
                    }
                },TIME_SLICE)
                setTimeout(function(){
                    self.$el.removeClass("attacking1").addClass("attacking2");
                },2*TIME_SLICE)
                setTimeout(function(){
                    self.$el.removeClass("attacking2");
                },3*TIME_SLICE)

                _.each(this.skillList, function(skill){
                    if ( skill.onAttack ){
                        skill.onAttack.call(skill, x, y, direction);
                    }
                },this);
                willAttack = true
            }
            return willAttack;
        },
        takeItem:function(direction){
            if ( this.model.get("freeze") ){
                return true;
            }
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            x += increment[direction].x;
            y += increment[direction].y;
            var block = getMapBlock(x,y);
            if ( block && block.type == "item" ){
                this.move(1, direction);
                return false;
            } else {
                return true;
            }
        },
        takeDamage:function(attack, type){
            if ( !type.contains("trap") && Math.random() < this.model.get("dexterity")*DIXTERITY_EFFECT/100 ) {
                return false;
            }
            var realDamage = attack - this.model.get("defend");
            _.each(this.skillList, function(skill){
                if ( skill.adjustDamage ){
                    realDamage = skill.adjustDamage.call(skill, realDamage, type);
                }
            },this);
            if ( realDamage > 0 ){
                //roomStatistic
                roomView.roomStatistic.hero.takeDamage+=realDamage;
                //roomStatistic end

                this.effecQueue.add.call(this.effecQueue,"♥-"+realDamage);
                this.model.set("hp",Math.max(this.model.get("hp")-realDamage,0));
            }
            return true;
        },
        getHp:function(hp){
            hp += Math.round( hp * this.model.get("recover")*window.RECOVER_EFFECT /100);
            this.model.getScore(hp);
            var realHeal = Math.min(hp, this.model.get("maxHp") - this.model.get("hp") );
            if ( realHeal > 0 ){
                this.effecQueue.add.call(this.effecQueue,"♥+"+realHeal, "effect-get-hp");
                this.model.set({
                    hp:this.model.get("hp")+realHeal
                });
            }
        },
        getCoolDown:function(cooldown){
            cooldown += Math.round( cooldown * this.model.get("concentrate")*window.CONCENTRATE_EFFECT /100 )
            this.model.getScore(cooldown);
            _.each(this.skillList, function(skill){
                if ( skill.getCoolDown ){
                    skill.getCoolDown.call(skill, cooldown);
                }
            },this);
        },
        curePoison:function(){
            this.model.set({
                poison:0
            });
        },
        onNewTurn:function(){
            if ( this.model.get("regeneration") ){
                if ( !gameStatus.win && !gameStatus.lose ) {
                    this.getHp(REGENERATION_EFFECT * this.model.get("regeneration"));
                }
            }
            if ( this.model.get("poison") ){
                this.effecQueue.add.call(this.effecQueue,"♥-"+this.model.get("poison")*(this.model.get("curse")?2:1));
                this.model.set("hp",this.model.get("hp")-this.model.get("poison"));
                if ( !this.model.get("hp") ) {
                    gameStatus.killBy = {
                        type :"poison"
                    }
                    return;
                }
            }
            if ( this.model.get("freeze") ){
                this.model.set("freeze",this.model.get("freeze")-1);
            }
            if ( this.model.get("dizzy") ){
                this.model.set("dizzy",this.model.get("dizzy")-1);
            }
            if ( this.model.get("locked") ){
                this.model.set("locked",this.model.get("locked")-1);
            }
            _.each(this.skillList, function(skill){
                if ( skill.onNewTurn ){
                    skill.onNewTurn.call(skill);
                }
            },this);
        },
        renderPoison:function(){
            if ( this.model.get("poison") && !this.model.previous("poison")) {
                this.$el.append("<div class='status-poison'>"+this.model.get("poison")+"</div>")
                this.effecQueue.add.call(this.effecQueue, "中毒");
            } else if ( !this.model.get("poison") && this.model.previous("poison")) {
                this.$(".status-poison").remove();
            } else if ( this.model.get("poison") ){
                this.$(".status-poison").html(this.model.get("poison"));
            }
        },
        renderDizzy:function(){
            if ( this.model.get("dizzy") && !this.model.previous("dizzy")) {
                this.$el.append("<div class='status-dizzy'></div>")
                this.effecQueue.add.call(this.effecQueue, "眩晕");
            } else if ( !this.model.get("dizzy") && this.model.previous("dizzy")) {
                this.$(".status-dizzy").remove();
            }
        },
        renderLocked:function(){
            if ( this.model.get("locked") && !this.model.previous("locked")) {
                this.$el.append("<div class='status-locked'></div>")
                this.effecQueue.add.call(this.effecQueue, "封魔");
                _.each(this.skillList, function(skill){
                    skill.set("locked",true)
                },this);
            } else if ( !this.model.get("locked") && this.model.previous("locked")) {
                this.$(".status-locked").remove();
                _.each(this.skillList, function(skill){
                    skill.set("locked",false)
                },this);
            }
        },
        renderCursed:function(){
            if ( this.model.get("cursed") && !this.model.previous("cursed")) {
                this.$el.append("<div class='status-cursed'></div>")
                this.effecQueue.add.call(this.effecQueue, "诅咒");
            } else if ( !this.model.get("cursed") && this.model.previous("cursed")) {
                this.$(".status-cursed").remove();
            }
        },
        onDying:function(){
            _.each(this.skillList, function(skill){
                if ( skill.onDying ){
                    skill.onDying.call(skill);
                }
            },this);
        },
        checkAlive:function(){
            if ( this.model.previous("hp")>0 && this.model.get("hp") <= 0 ) { //prevent multiple enter
                var self = this;
                setTimeout(function(){
                    self.onDying.call(self);
                    if ( self.model.get("hp") <= 0 ){
                        gameOver();
                    } else {
                        //复活了
                    }
                },100) //wait all monster attacked
            }
        },
        getPoison:function(p){
            if ( this.model.get("cursed") )
                p = p*2;
            if ( !this.model.get("poison") || p > this.model.get("poison") )
                this.model.set("poison", p );
            return true;
        },
        getCursed:function(p){
            this.model.set("cursed",p);
            return true;
        },
        getDizzy:function(d){
            this.model.set("dizzy",this.model.get("cursed")?d+1:d);
            return true;
        },
        getFreeze:function(f){
            this.model.set("freeze",this.model.get("cursed")?f+1:f);
            return true;
        },
        getLocked:function(d){
            this.model.set("locked",this.model.get("cursed")?d+1:d);
            return true;
        },
        getDisturb:function(d){
            this.effecQueue.add.call(this.effecQueue, "干扰");
            _.each(this.skillList, function(skill){
                if ( skill.get("currentCount") < skill.get("coolDown") ){
                    skill.set("currentCount", skill.get("currentCount")-d);
                }
            },this);
        }
    })

    exports.MonsterView = MovableView.extend({
        initialize:function(){
            MovableView.prototype.initialize.call(this);
            this.model.on("destroy",this.remove,this);
            this.model.on("change:level",this.renderLevel,this);
            this.model.on("change:angry",this.renderAngry,this);
        },
        render:function(){
            this.$el = $("<div class='monster'><lable class='monster-level'>lv"+this.model.get("level")+"</lable></div>")
            MovableView.prototype.render.call(this);
            this.levelEl = this.$(".monster-level");
            this.renderLevel();
            //this.levelEl.css({"line-height":window.blockSize.height+"px"});
            return this;
        },
        generate:function(){
            this.render();
            this.levelEl.hide();
            this.$el.css({
                opacity:0,
                transform:"scale(0.1)",
                transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s"
            })
            var self = this;
            setTimeout(function(){
                self.$el.css({
                    opacity:1,
                    transform:""
                })
                self.onGenerate.call(self);
            },10);
            setTimeout(function(){
                self.levelEl.show();
            },TIME_SLICE);
            return this;
        },
        renderLevel:function(){
            if ( this.model.get("level") >= WISDOM_THRESHOLD ) {
                if ( this.$(".status-elite.star1").length == 0 )
                    this.$el.append("<div class='status-elite star1'></div>");
            }
            if ( this.model.get("level") >= WISDOM_THRESHOLD*2 ) {
                if ( this.$(".status-elite.star2").length == 0 )
                    this.$el.append("<div class='status-elite star2'></div>");
            }
            if ( this.model.get("level") >= WISDOM_THRESHOLD*3 ) {
                if ( this.$(".status-elite.star3").length == 0 )
                    this.$el.append("<div class='status-elite star3'></div>");
            }
            this.levelEl.html("lv"+this.model.get("level"));
        },
        renderAngry:function(){
            if ( this.model.get("angry") && !this.model.previous("angry")) {
                this.$el.append("<div class='status-angry'></div>")
                this.effecQueue.add.call(this.effecQueue, "怒");
            } else if ( !this.model.get("angry") && this.model.previous("angry")) {
                this.$(".status-angry").remove();
            }
        },
        onMoveComplete:function(oldblock, newblock){
            var merge = oldblock.merge;
            if ( merge ) {
                var mergeToModel = oldblock.mergeTo;
                if ( mergeToModel ) {
                    this.onMergeTo(mergeToModel, oldblock.mergeToView);
                }
                this.model.destroy();
            } else {
                newblock.view = this;
                newblock.type = "monster";
                newblock.model = this.model;
                this.model.set("position",{x:newblock.x,y:newblock.y});
            }
        },
        beAttacked:function(direction, attack, type){
            if ( this.isAttacked ) //防止同时多次攻击一个怪物
                return false;
            this.isAttacked = true;
            var result = this.beAttackedForReal(direction, attack, type);
            if ( result ) {
                //命中
            } else {
                //没命中的话可以再打一次
                this.isAttacked = false;
            }
            return result;
        },
        beAttackedForReal:function(direction, attack, type){
            var oldx = this.model.get("position").x * blockSize.width ;
            var oldy = this.model.get("position").y * blockSize.height;
            var x = oldx + increment[direction].x * blockSize.width*0.35;
            var y = oldy + increment[direction].y * blockSize.height*0.35;
            this.$el.css({transition: "left "+TIME_SLICE/1000+"s ease-in-out 0s,top "+TIME_SLICE/1000+"s ease-in-out 0s", left:x, top:y});
            var self = this;
            setTimeout(function(){
                self.takeDamage(attack, type);
                if ( self.checkLive() )
                    self.$el.css({transition: "left "+TIME_SLICE/1000+"s ease-in-out 0s,top "+TIME_SLICE/1000+"s ease-in-out 0s", left:oldx, top:oldy});
            },TIME_SLICE)
            return true;
        },
        takeDamage:function(attack, type) {
            var diff = attack - this.model.get("defend");
            if ( diff > 0 ) {
                this.model.set("hp",this.model.get("hp") - diff);
            }
        },
        moveStar:function(el){
            if ( el.length ) {
                var p1 = this.$el.position();
                var p2 = heroView.$el.position()
                var p3 = el.position();
                el.appendTo(".map");
                el.css({
                    left: p3.left + p1.left,
                    top: p3.top + p1.top
                })
                setTimeout(function(){
                    el.css({
                        left:p2.left + blockSize.width/2-el.width()/2,
                        top:p2.top + blockSize.height/2-el.height()/2
                    })
                },10)
                setTimeout(function(){
                    el.remove();
                },410)
                gameStatus.gainStar++;
            }
        },
        checkLive:function(){
            if ( this.model.get("hp") <= 0 ) {
                //statistic
                statistic.kill.total++;
                var type = this.model.get("type");
                if ( statistic.kill.monsterCount[type] ){
                    statistic.kill.monsterCount[type]++
                } else
                    statistic.kill.monsterCount[type] = 1;

                if ( statistic.kill.monsterLevel[type] ) {
                    if ( this.model.get("level") > statistic.kill.monsterLevel[type] )
                        statistic.kill.monsterLevel[type] = this.model.get("level")
                } else {
                    statistic.kill.monsterLevel[type] = this.model.get("level")
                }
                if ( this.model.get("subType") == "boss") {
                    statistic.kill.bossCount = statistic.kill.bossCount ? statistic.kill.bossCount + 1 : 1;
                }
                //end of statistic
                //room statistic
                roomView.roomStatistic.kill.total ++;
                if ( roomView.roomStatistic.kill.type[type] ) {
                    roomView.roomStatistic.kill.type[type].total ++;
                    if ( roomView.roomStatistic.kill.type[type].level[this.model.get("level")] ) {
                        roomView.roomStatistic.kill.type[type].level[this.model.get("level")]++;
                    } else {
                        roomView.roomStatistic.kill.type[type].level[this.model.get("level")] = 1;
                    }
                } else {
                    roomView.roomStatistic.kill.type[type] = {
                        total : 1,
                        level: {}
                    }
                    roomView.roomStatistic.kill.type[type].level[this.model.get("level")] = 1;
                }
                //end of room statistic

                //move star to hero
                this.moveStar(this.$(".star1"));
                this.moveStar(this.$(".star2"));
                this.moveStar(this.$(".star3"));
                this.onDie();
                var level = this.model.get("level");
                window.hero.getExp(this.model.calExp(level), level);
                this.model.destroy();
                clearMapBlock(this.model.get("position").x, this.model.get("position").y);
                this.onDropItem(this.model.get("position").x, this.model.get("position").y);
                return false;
            }
            return true;
        },
        attack:function(){
            var attackDirection = this.checkInRange();
            if ( attackDirection != null ) {
                var isRange = this.model.get("range");
                var x = this.model.get("position").x * blockSize.width;
                var y = this.model.get("position").y * blockSize.height;
                var moveX = x  + increment[attackDirection].x * blockSize.width*0.35;
                var moveY = y  + increment[attackDirection].y * blockSize.height*0.35;
                if ( !isRange )
                    this.$el.css({transition: "left "+TIME_SLICE/1000+"s ease-in-out 0s,top "+TIME_SLICE/1000+"s ease-in-out 0s", left:moveX, top:moveY});
                this.$el.addClass("attacking0");
                this.$el.removeClass("d0 d1 d2 d3").addClass("d"+attackDirection);
                (function t(self) {
                    setTimeout(function () {
                        var att = self.model.calAttack.call(self, self.model.get("level"));
                        if (self.model.get("angry"))
                            att = att * 3;
                        if ( gameStatus.globalEffect.doubleAttack > 0 )
                            att = att * 2;
                        if ( self.model.get("level") >= 3*WISDOM_THRESHOLD )
                            att = att * 2;

                        gameStatus.killBy = {
                            type :"monster",
                            monsterLevel:self.model.get("level"),
                            monsterType:self.model.get("type")
                        }
                        if ( self.model.get("subType") == "boss" )
                            gameStatus.killBy.isBoss = true
                        var hit = heroView.takeDamage(att, self.model.get("attackType"));
                        if (!hit) {
                            self.effecQueue.add.call(self.effecQueue, "Miss!");
                        } else {
                            self.onHitHero();
                        }
                        if ( !isRange )
                            self.$el.css({transition: "left " + TIME_SLICE / 1000 + "s ease-in-out 0s,top " + TIME_SLICE / 1000 + "s ease-in-out 0s", left: x, top: y});
                    }, TIME_SLICE);
                    setTimeout(function(){
                        self.$el.removeClass("attacking0").addClass("attacking1");
                    },TIME_SLICE/2);
                    setTimeout(function(){
                        self.$el.removeClass("attacking1").addClass("attacking2");
                    },TIME_SLICE*3/2);
                    setTimeout(function(){
                        self.$el.removeClass("attacking2");
                        self.$el.removeClass("d0 d1 d2 d3").addClass("d"+self.model.get("direction"));
                    },TIME_SLICE*2);
                })(this);
            }
        },

        onGenerate:function(){
        },
        onDie:function(){
        },
        onNewTurn:function(){
            if ( this.model.get("freeze") ){
                this.model.set("freeze",this.model.get("freeze")-1);
            }
            this.model.set({
                angry:0
            });
        },
        onHitHero:function(){
            this.model.onHitHero();
            var curseRate = this.model.getCursePower();
            if ( Math.random() < curseRate ) {
                heroView.getCursed(1);
            }
            var freezeRate = this.model.getFreezePower();
            if ( Math.random() < freezeRate ) {
                heroView.getFreeze(2);
            }
            var dizzyRate = this.model.getDizzyPower();
            if ( Math.random() < dizzyRate ) {
                heroView.getDizzy(2);
            }
            var lockRate = this.model.getLockPower();
            if ( Math.random() < lockRate ) {
                heroView.getLocked(2);
            }
            var disturbRate = this.model.getDisturbPower();
            if ( Math.random() < disturbRate ) {
                heroView.getDisturb(1);
            }
        },

        onDropItem:function(x,y){
            roomView.checkDropItem(this.model.get("position").x, this.model.get("position").y, this.model.get("level"));
        },

        onMergeTo:function(mergeToModel, mergeToView){
            mergeToModel.setToLevel(this.model.get("level")+mergeToModel.get("level"));
            mergeToModel.mergeStatus(this.model);
            mergeToView.onMerged.call(mergeToView);
        },
        onMerged:function(){

        },
        checkInRange:function(){
            var range = this.calRange();
            _.each(heroView.skillList, function(skill){
                if ( skill.adjustRange ){
                    range = skill.adjustRange.call(skill, this.model.get("attackType"), range);
                }
            },this);
            return range;
        },
        getAttackRange:function(){
            return this.model.get("range")
        },
        calRange:function(){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            if ( this.model.get("range") ) {
                if ( window.hero.isInRange(x,y,this.model.get("range")) ){
                    return 1;
                } return null;
            }
            var ret = window.hero.isPositionNear(x,y);
            if ( ret )
                return ret.direction;
            else
                return null;
        }
    })

    exports.BossView = exports.MonsterView.extend({
        render:function(){
            exports.MonsterView.prototype.render.call(this)
            this.levelEl.css("visibility","hidden")
        },
        onMerged:function(){
            if ( this.model.get("level") == 2 ){ //no star + no star = 1 star
                this.model.set("level", WISDOM_THRESHOLD);
            } else if ( this.model.get("level") == WISDOM_THRESHOLD+1 ) { //no star + 1 star = 2 star
                this.model.set("level",2*WISDOM_THRESHOLD)
            } else if ( this.model.get("level") == 2*WISDOM_THRESHOLD+1 ) { //no star + 2 star = 3 star
                this.model.set("level",3*WISDOM_THRESHOLD)
            } else if ( this.model.get("level") == 2*WISDOM_THRESHOLD ) { //1 star + 1 star = 3 star
                this.model.set("level",3*WISDOM_THRESHOLD)
            }
        }
    })

    exports.ArcherView = exports.MonsterView.extend({
        /*attack:function(){
            var attackDirection = this.checkInRange();
            if ( attackDirection != null ) {
                this.$el.addClass("attacking0");
                (function t(self) {
                    setTimeout(function () {
                        var att = self.model.calAttack.call(self, self.model.get("level"));
                        if (self.model.get("angry"))
                            att = att * 3;
                        if ( gameStatus.globalEffect.doubleAttack > 0 )
                            att = att * 2;
                        gameStatus.killBy = {
                            type :"monster",
                            monsterLevel:self.model.get("level"),
                            monsterType:self.model.get("type")
                        }
                        var hit = heroView.takeDamage(att);
                        if (!hit) {
                            self.effecQueue.add.call(self.effecQueue, "Miss!");
                        }
                    }, TIME_SLICE);
                    setTimeout(function () {
                        self.$el.removeClass("attacking0").addClass("attacking1");
                    }, TIME_SLICE / 2);
                    setTimeout(function () {
                        self.$el.removeClass("attacking1").addClass("attacking2");
                    }, TIME_SLICE * 3 / 2);
                    setTimeout(function () {
                        self.$el.removeClass("attacking2");
                    }, TIME_SLICE * 2);
                })(this);
            }
        },
        calRange:function(){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            var heroX = window.hero.get("position").x;
            var heroY = window.hero.get("position").y;
            if ( Math.abs(x-heroX) + Math.abs(y-heroY) <= this.getAttackRange() ) {
                return 3;
            }
            return null;
        }*/
    })

    exports.GargoyleView = exports.MonsterView.extend({
    })

    exports.GhostView = exports.MonsterView.extend({
        beAttackedForReal:function(direction, attack, type){
            if ( type.contains("normal") ) {
                var dodgeRate = this.model.getDodgePower();
                if ( Math.random() < dodgeRate ) {
//                    this.effecQueue.add.call(this.effecQueue, "Dodge");
                    return false;
                }
            }
            return exports.MonsterView.prototype.beAttackedForReal.call(this,direction, attack, type);
        }
    })

    exports.GoblinView = exports.MonsterView.extend({
        onMerged:function(){
            this.effecQueue.add.call(this.effecQueue, "Level Up");
            this.model.setToLevel(this.model.get("level")+1);
        }
    })

    exports.GolemView = exports.MonsterView.extend({
        beAttackedForReal:function(direction, attack, type){
            if ( type.contains("skill") ) {
                return false;
            }
            return exports.MonsterView.prototype.beAttackedForReal.call(this,direction, attack, type);
        }
    })

    exports.KoboldView = exports.MonsterView.extend({
    })

    exports.MedusaView = exports.MonsterView.extend({
    })

    exports.MimicView = exports.MonsterView.extend({
        onDropItem:function(x,y){
            roomView.createItem(x,y, Math.ceil(this.model.get("level")/2));
        }
    })

    exports.MinotaurView = exports.MonsterView.extend({

    })

    exports.MummyView = exports.MonsterView.extend({

    })

    exports.OgreView = exports.MonsterView.extend({

    })

    exports.OrcView = exports.MonsterView.extend({
        onGenerate:function(){
            this.model.set({
                angry:1
            });
        },
        onMerged:function(){
            this.model.set({
                angry:1
            });
        }
    })

    exports.RatManView = exports.MonsterView.extend({
        onBeforeHeroTakeItem:function(){
            if ( !this.model.get("willSteal") )
                return true;
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;

            var candidate = [];
            var block = getMapBlock(x-1,y);
            if ( block && block.type === "item" ) {
                candidate.push(block)
            }
            block = getMapBlock(x+1,y);
            if ( block && block.type === "item" ) {
                candidate.push(block)
            }
            block = getMapBlock(x,y-1);
            if ( block && block.type === "item" ) {
                candidate.push(block)
            }
            block = getMapBlock(x,y+1);
            if ( block && block.type === "item" ) {
                candidate.push(block)
            }

            if ( candidate.length > 0 ) {
                var block = getRandomItem(candidate);
                var itemView = block.view;
                itemView.$el.css({transition: "all "+(TIME_SLICE*4/5000)+"s ease-in-out 0s", left:x*blockSize.width,
                    top:y*blockSize.width,
                    transform:"scale(0.5)",
                    opacity:0.5});
                var self = this;
                setTimeout(function(){
                    var l = itemView.model.get("level");
                    itemView.model.destroy();
                    self.effecQueue.add.call(self.effecQueue,"Level Up");
                    self.model.setToLevel(self.model.get("level")+l);
                },1+TIME_SLICE*4/5)

                block.view = null;
                block.model = null;
                block.type = "blank";
                return false;
            }
            return true;
        },
        onNewTurn:function(){
            exports.MonsterView.prototype.onNewTurn.call(this);
            this.model.set("willSteal",false);
        },
        onMerged:function(){
            this.model.set("willSteal",true);
        }
    })

    exports.ShamanView = exports.MonsterView.extend({
        checkMonster:function(x,y){
            if ( !map[x] )
                return;
            var mapBlock = map[x][y];
            if ( !mapBlock )
                return;
            if ( mapBlock.type == "monster") {
                mapBlock.model.set("angry",1);
            }
        },
        effectAround:function(){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;

            this.checkMonster(x-1,y);
            this.checkMonster(x+1,y);
            this.checkMonster(x,y-1);
            this.checkMonster(x,y+1);
        },
        onGenerate:function(){
            this.effectAround();
        },
        onMerged:function(){
            this.effectAround();
        }
    })

    exports.SkeletonView = exports.MonsterView.extend({

    })

    exports.SlimeView = exports.MonsterView.extend({

    })

    exports.SnakeView = exports.MonsterView.extend({

    })

    exports.TrollView = exports.MonsterView.extend({
    })

    exports.VampireView = exports.MonsterView.extend({
        onHitHero:function(){
            exports.MonsterView.prototype.onHitHero.call(this);
            this.effecQueue.add.call(this.effecQueue,"Level Up");
        }
    })

    exports.BossBeholderView = exports.BossView.extend({
        onGenerate:function(){
            if ( gameStatus.globalEffect.madness )
                gameStatus.globalEffect.madness++;
            else
                gameStatus.globalEffect.madness = 1;
        },
        onDie:function(){
            gameStatus.globalEffect.madness--;
        }
    })

    exports.BossDeathView = exports.BossView.extend({

    })

    exports.BossHydraView = exports.BossView.extend({
        onGenerate:function(){
            if ( gameStatus.globalEffect.doubleAttack )
                gameStatus.globalEffect.doubleAttack++;
            else
                gameStatus.globalEffect.doubleAttack = 1;
        },
        onDie:function(){
            gameStatus.globalEffect.doubleAttack--;
        }
    })

    exports.BossLichView = exports.BossView.extend({

    })

    exports.ViewMap = {
        archer:exports.ArcherView,
        gargoyle:exports.GargoyleView,
        ghost:exports.GhostView,
        goblin:exports.GoblinView,
        golem:exports.GolemView,
        kobold:exports.KoboldView,
        medusa:exports.MedusaView,
        mimic:exports.MimicView,
        minotaur:exports.MinotaurView,
        mummy:exports.MummyView,
        ogre:exports.OgreView,
        orc:exports.OrcView,
        "rat-man":exports.RatManView,
        shaman:exports.ShamanView,
        slime:exports.SlimeView,
        skeleton:exports.SkeletonView,
        snake:exports.SnakeView,
        troll:exports.TrollView,
        vampire:exports.VampireView,

        "boss-beholder":exports.BossBeholderView,
        "boss-death": exports.BossDeathView,
        "boss-hydra": exports.BossHydraView,
        "boss-lich": exports.BossLichView
    };

    exports.ItemView = MovableView.extend({
        initialize:function(){
            MovableView.prototype.initialize.call(this);
            this.model.on("destroy",this.remove,this);
            this.model.on("change:level",this.renderLevel,this);
        },
        render:function(){
            this.$el = $("<div class='item'><lable class='item-level'>lv"+this.model.get("level")+"</lable></div>")
            MovableView.prototype.render.call(this);
            this.levelEl = this.$(".item-level");
            this.renderLevel();
            //this.levelEl.css({"line-height":window.blockSize.height+"px"});
            return this;
        },
        renderLevel:function(){
            if ( this.model.get("level") >= WISDOM_THRESHOLD ) {
                if ( this.$(".status-elite.star1").length == 0 )
                    this.$el.append("<div class='status-elite star1'></div>");
            }
            if ( this.model.get("level") >= WISDOM_THRESHOLD*2 ) {
                if ( this.$(".status-elite.star2").length == 0 )
                    this.$el.append("<div class='status-elite star2'></div>");
            }
            if ( this.model.get("level") >= WISDOM_THRESHOLD*3 ) {
                if ( this.$(".status-elite.star3").length == 0 )
                    this.$el.append("<div class='status-elite star3'></div>");
            }
            this.levelEl.html("lv"+this.model.get("level"));
        },
        onMoveComplete:function(oldblock, newblock){
            var merge = oldblock.merge;
            if ( merge ) {
                //console.log("merge")
                var mergeToModel = oldblock.mergeTo;
                if ( mergeToModel ) {
                    mergeToModel.setToLevel(this.model.get("level")+mergeToModel.get("level"));
                }
                this.model.destroy();
            } else {
                if ( oldblock.beTaken ) {
                    //console.log("be taken")
                    this.beTaken();
                } else {
                    //console.log("new position")
                    newblock.view = this;
                    newblock.type = "item";
                    newblock.model = this.model;
                    this.model.set("position",{x:newblock.x,y:newblock.y});
                }
            }
        },
        moveStar:function(el){
            if ( el.length ) {
                var p1 = this.$el.position();
                var p2 = heroView.$el.position()
                var p3 = el.position();
                el.appendTo(".map");
                el.css({
                    left: p3.left + p1.left,
                    top: p3.top + p1.top
                })
                setTimeout(function(){
                    el.css({
                        left:p2.left + blockSize.width/2-el.width()/2,
                        top:p2.top + blockSize.height/2-el.height()/2
                    })
                },10)
                setTimeout(function(){
                    el.remove();
                },410)
                gameStatus.gainStar++;
            }
        },
        beTaken:function(){
            //statistic
            statistic.items.total = statistic.items.total?statistic.items.total+1:1;
            var type = this.model.get("type");
            statistic.items.itemCount = statistic.items.itemCount || {};
            statistic.items.itemLevel = statistic.items.itemLevel || {};
            if ( statistic.items.itemCount[type] ){
                statistic.items.itemCount[type]++
            } else
                statistic.items.itemCount[type] = 1;

            if ( statistic.items.itemLevel[type] ) {
                if ( this.model.get("level") > statistic.items.itemLevel[type] )
                    statistic.items.itemLevel[type] = this.model.get("level")
            } else {
                statistic.items.itemLevel[type] = this.model.get("level")
            }
            //end of statistic
            //room statistic
            roomView.roomStatistic.item.total ++;
            if ( roomView.roomStatistic.item.type[type] ) {
                roomView.roomStatistic.item.type[type].total ++;
                if ( roomView.roomStatistic.item.type[type].level[this.model.get("level")] ) {
                    roomView.roomStatistic.item.type[type].level[this.model.get("level")]++;
                } else {
                    roomView.roomStatistic.item.type[type].level[this.model.get("level")] = 1;
                }
            } else {
                roomView.roomStatistic.item.type[type] = {
                    total : 1,
                    level: {}
                }
                roomView.roomStatistic.item.type[type].level[this.model.get("level")] = 1;
            }
            //end of room statistic

            this.model.effectHappen();
            var self = this;
            this.$el.css({transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s", "margin-top":-blockSize.height/2,opacity:0.4});
            this.moveStar(this.$(".star1"));
            this.moveStar(this.$(".star2"));
            this.moveStar(this.$(".star3"));
            setTimeout(function(){
                self.model.destroy();
            },TIME_SLICE);
        }
    });

    exports.TerrainView = MovableView.extend({
        initialize:function(){
            MovableView.prototype.initialize.call(this);
            this.model.on("destroy",this.remove,this);
        },
        render:function(){
            this.$el = $("<div class='terrain'></div>")
            MovableView.prototype.render.call(this);
            return this;
        },
        canMove:function(){
            return false;
        },
        canPass:function(){
            return this.model.get("canPass")
        },
        canGenerateIn:function(){
            return this.model.get("canGenerateIn")
        },
        canCatch:function(){
            return this.model.get("canCatch")
        },
        onBeforeHeroAttack:function(block){
            if ( this.model.onBeforeHeroAttack )
                return this.model.onBeforeHeroAttack(block);
            return true;
        },
        onBeforeTurnEnd:function(block){
            if ( this.model.onBeforeTurnEnd )
                return this.model.onBeforeTurnEnd(block);
            return true;
        }
    })

    exports.HeroStatusView = Backbone.View.extend({
        events:{
            "click .room-sign": "showRoomSign"
        },
        initialize:function(){
            this.type = this.$(".hero-type");
            this.hp = this.$(".hero-hp");
            this.level = this.$(".hero-level");
            this.exp = this.$(".hero-exp");
            this.score = this.$(".hero-score");
            this.model.on("change",this.render, this);
        },
        render:function(){
            this.type.html(Help.heroRaceDisplayName[this.model.get("race")]+Help.heroTypeDisplayName[this.model.get("type")])
            var hp = this.model.get("hp");
            this.hp.html("<span class='hp-symbol'>♥</span>"+(hp>0?hp:0)+"/"+this.model.get("maxHp"));
            if ( hp <= this.model.get("maxHp")/5) {
                this.hp.addClass("little-danger")
            } else {
                this.hp.removeClass("little-danger");
            }
            if ( hp <= this.model.get("maxHp")/10) {
                this.hp.addClass("danger")
            } else {
                this.hp.removeClass("danger");
            }
            this.level.html("lv:"+this.model.get("level"));
            this.exp.html("exp:"+this.model.get("exp")+"/"+this.model.get("maxExp"));
            if ( this.model.get("exp") >= this.model.get("maxExp")*4/5) {
                this.exp.addClass("nearly-level-up")
            } else {
                this.exp.removeClass("nearly-level-up");
            }
            if ( this.model.get("exp") >= this.model.get("maxExp")*9/10) {
                this.exp.addClass("almost-level-up")
            } else {
                this.exp.removeClass("almost-level-up");
            }
            this.score.html(this.model.get("score")+"分")

            if ( window.windowOriention == "landscape") {
                this.$el.css({
                    width:roomWidth/basicMapWidth*0.9
                })
                this.$(".room-sign").css({
                    width:roomWidth/basicMapWidth*0.5,
                    height:roomWidth/basicMapWidth*0.5
                })
            } else {
                this.$el.css({
                    height:roomHeight/basicMapHeight*0.75
                })
                this.$(".room-sign").css({
                    width:roomHeight/basicMapHeight*0.5,
                    height:roomHeight/basicMapHeight*0.5
                })
            }
            return this;
        },

        showRoomSign:function(event){
            event.stopPropagation();
            roomView.showRoomSign();
        }
    })

    var EffectQueue = Backbone.View.extend({
        initialize:function(){
            this.queue = [];
        },
        add:function(string, stringClass){
            this.queue.push({string:string, stringClass:stringClass});
            if ( !this.isRunning ){
                this.start();
            }
        },
        start:function(){
            this.isRunning = true;
            var obj = this.queue.shift();
            if ( !obj ) {
                this.isRunning = false;
                return;
            }

            (function(str1, stringClass1) {
                var el = $("<label class='effect-label unselectable'>"+str1+"</label>");
                if ( stringClass1 )
                    el.addClass(stringClass1)
                this.$el.append(el);
                setTimeout(function () {
                    el.css({
                        "margin-top": "-40%"
                    });
                }, 50)

                setTimeout(function () {
                    el.remove();
                }, 650);

                var self = this;
                setTimeout(function(){
                    self.start.call(self);
                }, 200);
            }).call(this, obj.string, obj.stringClass);
        },
        isRunning : false,
        render:function(){
            this.$el.addClass("effect-queue");
            return this;
        }
    })
});