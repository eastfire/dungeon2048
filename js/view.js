define(function(require,exports,module){
    var getMapBlock = function(x,y){
        if ( x >= 0 && x < mapWidth && y >= 0 && y < mapHeight ){
            return map[x][y];
        }
        return null;
    }

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
            this.$el.css({transition: "all "+(TIME_SLICE/1000)*movement+"s ease-in-out 0s", left:x2, top:y2});

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
        render:function(){
            this.$el.css({
                position:"absolute",
                width: blockSize.width,
                height: blockSize.height,
                left:this.model.get("position").x*blockSize.width,
                top:this.model.get("position").y*blockSize.height
            }).addClass(this.model.get("type"))
            this.renderDirection();
            return this;
        },
        renderDirection:function(){
            this.$el.removeClass("d0 d1 d2 d3")
                .addClass("d"+this.model.get("direction"))
        },
        onMoveComplete:function(){

        },
        remove:function(){
            this.$el.remove();
        }
    });
    exports.HeroView = MovableView.extend({
        render:function(){
            this.$el = $("<div class='hero'></div>")
            MovableView.prototype.render.call(this);
            return this;
        },
        onMoveComplete:function(oldblock, newblock){
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
                    monsterView.beAttacked(direction,self.model.get("attack"));
                },TIME_SLICE)
                setTimeout(function(){
                    self.$el.removeClass("attacking1").addClass("attacking0");
                },2*TIME_SLICE)
                setTimeout(function(){
                    self.$el.removeClass("attacking0");
                },3*TIME_SLICE)

                return false;
            } else {
                return true;
            }
        },
        takeDamage:function(attack){
            var realDamage = attack - this.model.get("defend");
            this.model.set("hp",this.model.get("hp") - attack);
        }
    })

    exports.MonsterView = MovableView.extend({
        initialize:function(){
            MovableView.prototype.initialize.call(this);
            this.model.on("destroy",this.remove,this);
            this.model.on("change:level",this.renderLevel,this);
        },
        render:function(){
            this.$el = $("<div class='monster'><lable class='monster-level'>lv"+this.model.get("level")+"</lable></div>")
            MovableView.prototype.render.call(this);
            this.levelEl = this.$(".monster-level");
            //this.levelEl.css({"line-height":window.blockSize.height+"px"});
            return this;
        },
        renderLevel:function(){
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
                newblock.type = "monster";
                newblock.model = this.model;
                this.model.set("position",{x:newblock.x,y:newblock.y});
            }
        },
        beAttacked:function(direction, attack){
            var oldx = this.model.get("position").x * blockSize.width ;
            var oldy = this.model.get("position").y * blockSize.height;
            var x = oldx + increment[direction].x * blockSize.width*0.35;
            var y = oldy + increment[direction].y * blockSize.height*0.35;
            this.$el.css({transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s", left:x, top:y});
            var self = this;
            setTimeout(function(){
                self.takeDamage(attack);
                if ( self.checkLive() )
                    self.$el.css({transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s", left:oldx, top:oldy});
            },TIME_SLICE)
        },
        takeDamage:function(attack) {
            var diff = attack - this.model.get("defend");
            if ( diff > 0 ) {
                this.model.set("hp",this.model.get("hp") - diff);
            }
        },
        checkLive:function(){
            if ( this.model.get("hp") <= 0 ) {
                window.hero.getExp(this.model.get("exp"));
                this.model.destroy();
                clearMapBlock(this.model.get("position").x, this.model.get("position").y);
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
                this.$el.css({transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s", left:moveX, top:moveY});
                var self = this;
                setTimeout(function(){
                    heroView.takeDamage(self.model.get("attack"));
                    self.$el.css({transition: "all "+TIME_SLICE/1000+"s ease-in-out 0s", left:x, top:y});
                },TIME_SLICE)
            }
        },

        checkInRange:function(){
            var x = this.model.get("position").x;
            var y = this.model.get("position").y;
            var heroX = window.hero.get("position").x;
            var heroY = window.hero.get("position").y;
            var attackDirection = null;
            if ( x == heroX && y == heroY-1 ){
                attackDirection = 2;
            } else if ( x == heroX && y == heroY+1 ){
                attackDirection = 0;
            } else if ( y == heroY && x == heroX+1 ){
                attackDirection = 3;
            } else if ( y == heroY && x == heroX-1 ){
                attackDirection = 1;
            }
            return attackDirection;
        }
    })

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
            this.hp.html("HP:"+this.model.get("hp")+"/"+this.model.get("maxHp"));
            this.level.html("LV:"+this.model.get("level"));
            this.exp.html("EXP:"+this.model.get("exp")+"/"+this.model.get("maxExp"));
            if ( this.model.get("hp") <= 0 ) {
                //die
                gameOver();
            }
            return this;
        }
    })
});