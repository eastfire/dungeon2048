define(function(require,exports,module){
    var Skill = require("./skill");

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
            var oldblock = map[oldx][oldy];
            oldblock.type = "blank";
            oldblock.view = null;
            oldblock.model = null;

            var self = this;
            var newblock = map[x1][y1];
            setTimeout(function(){
                self.onMoveComplete.call(self, oldblock, newblock);
            },1+TIME_SLICE*movement)
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
        renderFreeze:function(){
            if ( this.model.get("freeze") && !this.model.previous("freeze")) {
                this.$el.append("<div class='status-freeze'></div>")
                this.effecQueue.add.call(this.effecQueue, "麻痹");
            } else if ( !this.model.get("freeze") && this.model.previous("freeze")) {
                this.$(".status-freeze").remove();
            }
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
            this.skillList = [];
        },
        render:function(){
            this.$el = $("<div class='hero'></div>")
            MovableView.prototype.render.call(this);
            return this;
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
                    width: blockSize.width*3/4,
                    height: blockSize.height*3/4,
                    margin: blockSize.width/8
                })
                list.append(emptySlot)
            }
        },
        levelUp:function(){
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
        attack:function(direction){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            x += increment[direction].x;
            y += increment[direction].y;
            var block = getMapBlock(x,y);
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
                    self.$el.removeClass("attacking1").addClass("attacking0");
                },2*TIME_SLICE)
                setTimeout(function(){
                    self.$el.removeClass("attacking0");
                },3*TIME_SLICE)

                _.each(this.skillList, function(skill){
                    if ( skill.onAttack ){
                        skill.onAttack.call(skill, x, y, direction);
                    }
                },this);
                return false;
            } else {
                return true;
            }
        },
        takeItem:function(direction){
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
            if ( Math.random() < this.model.get("dexterity")*DIXTERITY_EFFECT/100 ) {
                return false;
            }
            var realDamage = attack - this.model.get("defend");
            if ( realDamage > 0 ){
                this.effecQueue.add.call(this.effecQueue,"♥-"+realDamage);
                this.model.set("hp",this.model.get("hp")-realDamage);
            }
            return true;
        },
        getHp:function(hp){
            hp += this.model.get("recover");
            this.model.set("score",this.model.get("score")+hp);
            var realHeal = Math.min(hp, this.model.get("maxHp") - this.model.get("hp") );
            if ( realHeal > 0 ){
                this.effecQueue.add.call(this.effecQueue,"♥+"+realHeal);
                this.model.set({
                    hp:this.model.get("hp")+realHeal,
                    poison:0
                });
            }
        },
        onNewRound:function(){
            if ( this.model.get("poison") ){
                this.effecQueue.add.call(this.effecQueue,"♥-"+this.model.get("poison"));
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
            _.each(this.skillList, function(skill){
                if ( skill.onNewRound ){
                    skill.onNewRound.call(skill);
                }
            },this);
        },
        renderPoison:function(){
            if ( this.model.get("poison") && !this.model.previous("poison")) {
                this.$el.append("<div class='status-poison'></div>")
                this.effecQueue.add.call(this.effecQueue, "中毒");
            } else if ( !this.model.get("poison") && this.model.previous("poison")) {
                this.$(".status-poison").remove();
            }
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

                //move star to hero
                this.moveStar(this.$(".star1"));
                this.moveStar(this.$(".star2"));
                this.moveStar(this.$(".star3"));
                var level = this.model.get("level");
                window.hero.getExp(this.model.get("exp"), level);
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

                var x = this.model.get("position").x * blockSize.width;
                var y = this.model.get("position").y * blockSize.height;
                var moveX = x  + increment[attackDirection].x * blockSize.width*0.35;
                var moveY = y  + increment[attackDirection].y * blockSize.height*0.35;
                this.$el.css({transition: "left "+TIME_SLICE/1000+"s ease-in-out 0s,top "+TIME_SLICE/1000+"s ease-in-out 0s", left:moveX, top:moveY});
                this.$el.addClass("attacking0");
                this.$el.removeClass("d0 d1 d2 d3").addClass("d"+attackDirection);
                (function t(self) {
                    setTimeout(function () {
                        var att = self.model.get("attack");
                        if (self.model.get("angry"))
                            att = att * 3;
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
                        self.$el.css({transition: "left " + TIME_SLICE / 1000 + "s ease-in-out 0s,top " + TIME_SLICE / 1000 + "s ease-in-out 0s", left: x, top: y});
                    }, TIME_SLICE);
                    setTimeout(function(){
                        self.$el.removeClass("attacking0").addClass("attacking1");
                    },TIME_SLICE/2);
                    setTimeout(function(){
                        self.$el.removeClass("attacking1").addClass("attacking0");
                    },TIME_SLICE*3/2);
                    setTimeout(function(){
                        self.$el.removeClass("attacking0");
                        self.$el.removeClass("d0 d1 d2 d3").addClass("d"+self.model.get("direction"));
                    },TIME_SLICE*2);
                })(this);
            }
        },

        onGenerate:function(){
        },
        onNewRound:function(){
            this.model.set({
                angry:0
            });
        },
        onHitHero:function(){
            this.model.onHitHero();
        },

        onDropItem:function(x,y){
            generateItem(this.model.get("position").x, this.model.get("position").y, this.model.get("level"));
        },

        onMergeTo:function(mergeToModel, mergeToView){
            mergeToModel.setToLevel(this.model.get("level")+mergeToModel.get("level"));
            mergeToModel.mergeStatus(this.model);
            mergeToView.onMerged.call(mergeToView);
        },
        onMerged:function(){

        },
        checkInRange:function(){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            var ret = window.hero.isPositionNear(x,y);
            if ( ret )
                return ret.direction;
            else
                return null;
            return attackDirection;
        }
    })

    exports.BossView = exports.MonsterView.extend({
        render:function(){
            exports.MonsterView.prototype.render.call(this)
            this.levelEl.css("visibility","hidden")
        }
    })

    exports.ArcherView = exports.MonsterView.extend({
        attack:function(){
            var attackDirection = this.checkInRange();
            if ( attackDirection != null ) {
                this.$el.addClass("attacking0");
                (function t(self) {
                    setTimeout(function () {
                        var hit = heroView.takeDamage(self.model.get("attack"));
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
        checkInRange:function(){
//            var x = this.model.get("position").x;
//            var y = this.model.get("position").y;
//            var heroX = window.hero.get("position").x;
//            var heroY = window.hero.get("position").y;
//            if (( x == heroX && y == heroY-1 ) || ( x == heroX && y == heroY+1 ) ||
//                ( y == heroY && x == heroX+1 ) || ( y == heroY && x == heroX-1 ) ){
//                return null;
//            }
            return 3;
        }
    })

    exports.GhostView = exports.MonsterView.extend({
        beAttacked:function(direction, attack, type){
            if ( type.contains("normal") ) {
                var dodgeRate = this.model.getDodgeRate();
                if ( Math.random() < dodgeRate ) {
//                    this.effecQueue.add.call(this.effecQueue, "Dodge");
                    return false;
                }
            }
            return exports.MonsterView.prototype.beAttacked.call(this,direction, attack, type);
        }
    })

    exports.GoblinView = exports.MonsterView.extend({
        onMerged:function(){
            this.effecQueue.add.call(this.effecQueue, "Level Up");
            this.model.setToLevel(this.model.get("level")+1);
        }
    })

    exports.MedusaView = exports.MonsterView.extend({
        onHitHero:function(){
            exports.MonsterView.prototype.onHitHero.call(this);
            var freezeRate = this.model.getFreezeRate();
            if ( Math.random() < freezeRate ) {
                hero.set("freeze",2);
            }
        }
    })

    exports.MimicView = exports.MonsterView.extend({
        onDropItem:function(x,y){
            generateItemForSure(x,y, this.model.get("level"));
        }
    })

    exports.MinotaurView = exports.MonsterView.extend({

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

    exports.VampireView = exports.MonsterView.extend({
        onHitHero:function(){
            exports.MonsterView.prototype.onHitHero.call(this);
            this.effecQueue.add.call(this.effecQueue,"Level Up");
        }
    })

    exports.BossDeathView = exports.BossView.extend({

    })

    exports.ViewMap = {
        archer:exports.ArcherView,
        ghost:exports.GhostView,
        goblin:exports.GoblinView,
        medusa:exports.MedusaView,
        mimic:exports.MimicView,
        minotaur:exports.MinotaurView,
        ogre:exports.OgreView,
        orc:exports.OrcView,
        shaman:exports.ShamanView,
        slime:exports.SlimeView,
        skeleton:exports.SkeletonView,
        snake:exports.SnakeView,
        vampire:exports.VampireView,

        "boss-death": exports.BossDeathView
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
                var mergeToModel = oldblock.mergeTo;
                if ( mergeToModel ) {
                    mergeToModel.setToLevel(this.model.get("level")+mergeToModel.get("level"));
                }
                this.model.destroy();
            } else {
                newblock.view = this;
                newblock.type = "item";
                newblock.model = this.model;
                this.model.set("position",{x:newblock.x,y:newblock.y});
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

    exports.HeroStatusView = Backbone.View.extend({
        initialize:function(){
            this.type = this.$(".hero-type");
            this.hp = this.$(".hero-hp");
            this.level = this.$(".hero-level");
            this.exp = this.$(".hero-exp");
            this.model.on("change",this.render, this);
        },
        render:function(){
            this.type.html(this.model.get("typeDisplayName"))
            var hp = this.model.get("hp");
            this.hp.html("<span class='hp-symbol'>♥</span>"+(hp>0?hp:0)+"/"+this.model.get("maxHp"));
            this.level.html("LV:"+this.model.get("level"));
            this.exp.html("EXP:"+this.model.get("exp")+"/"+this.model.get("maxExp"));
            if ( window.windowOriention == "landscape") {
                this.$el.css({
                    width:blockSize.width*1.5
                })
            }
            if ( this.model.get("hp") <= 0 ) {
                gameOver();
            }
            return this;
        }
    })

    var EffectQueue = Backbone.View.extend({
        initialize:function(){
            this.queue = [];
        },
        add:function(string){
            this.queue.push(string);
            if ( !this.isRunning ){
                this.start();
            }
        },
        start:function(){
            this.isRunning = true;
            var str = this.queue.shift();
            if ( !str ) {
                this.isRunning = false;
                return;
            }

            (function(str1) {
                var el = $("<label class='effect-label unselectable'>"+str1+"</label>");
                this.$el.append(el);
                setTimeout(function () {
                    el.css({
                        "margin-top": "-40%"
                    });
                }, 50)

                setTimeout(function () {
                    el.remove();
                }, 600);

                var self = this;
                setTimeout(function(){
                    self.start.call(self);
                }, 200);
            }).call(this, str);
        },
        isRunning : false,
        render:function(){
            this.$el.addClass("effect-queue");
            return this;
        }
    })
});