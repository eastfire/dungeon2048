define(function(require,exports,module) {
    var initSkillConst = function(){
        window.DIXTERITY_EFFECT = 3;
        window.CUNNING_EFFECT = 5;
        window.CONSTITUTION_EFFECT = 10;
        window.LEVELUP_HP_EFFECT = 10;
        window.WISDOM_EFFECT = 10;
        window.WISDOM_THRESHOLD = 6;
        window.TREASURE_HUNTING_EFFECT = 5;
        window.COOLING_EFFECT = 10;
        window.RECOVER_EFFECT = 25;
        window.REGENERATION_EFFECT = 1;
    }

    exports.SkillView = Backbone.View.extend({
        initialize:function(options){
            if ( options.mode == "select" ) {
                this.$el.addClass("skill");
                var lvStr = "";
                if ( this.model.get("maxLevel") > 1 ) {
                    lvStr = "lv"+this.model.get("level");
                }
                this.$el.addClass("btn btn-default");
                this.$el.html("<span class='skill-image-icon'>" +
                    "<div class='skill-image skill-image-"+this.model.get("name")+"'></div></span>" +
                    "<span class='skill-description'>" +
                    "<div class='skill-level'>"+this.model.get("displayName")+lvStr + "</div>" +
                    "<div class='skill-text'>"+this.model.generateDescription()+"</div>" +
                    "</span>")
                this.$el.css({
                    "font-size":blockSize.height/5+"px"
                })
                var image = this.$(".skill-image");
                setTimeout(function(){
                    image.height(image.width())
                },100)
            } else if ( options.mode == "list") {
                this.$el.addClass("skill");
                var durationStr = "";
                this.$el.html("<div class='skill-image-icon'>" +
                    "<div class='skill-image skill-image-"+this.model.get("name")+"'></div>" +
                    "<div class='skill-cool-down'></div>"+
                    "<div class='skill-level'>" + this.model.get("displayName")+ "</div>"+
                    "<div class='skill-duration' style='display:none'></div>" +
                    "</div>")
                this.$el.css({
                    "font-size":blockSize.height/6+"px"
                })
                var w = blockSize.width*3/4;
                var h = blockSize.height*3/4;
                this.$(".skill-level").width(w)
                this.$(".skill-image-icon").width(w)
                var image = this.$(".skill-image");
                image.height(h).width(w)
                this.$(".skill-image-icon").css("margin",(blockSize.width-w)/2)
                this.$(".skill-cool-down").css("line-height",h+"px");
                this.coolDown = this.$(".skill-cool-down");
                this.renderCoolDown();
                this.model.on("change:coolDown",this.renderCoolDown,this);
                this.model.on("change:currentCount",this.renderCoolDown,this);
                var self = this;
                this.$el.on("click",function(){
                    if ( window.gameStatus.phase != PHASE_USER )
                        return;
                    if ( self.model.get("locked") )
                        return;
                    var count = self.model.get("currentCount");
                    var coolDown = self.model.calCoolDown();
                    if ( count >= coolDown ) {
                        hero.getScore(1);
                        heroView.useSkill();
                        self.model.onActive.call(self.model);
                    }
                })
                this.model.on("change:locked",this.renderLocked,this);
            }
        },
        renderLocked:function(){
            if ( this.model.get("locked") ) {
                this.$(".skill-image-icon .skill-image").addClass("skill-locked")
            } else {
                this.$(".skill-image-icon .skill-image").removeClass("skill-locked")
            }
        },
        renderCoolDown:function(){
            var count = this.model.get("currentCount");
            var coolDown = this.model.calCoolDown();
            if ( count < coolDown ) {
                this.coolDown.show();
                this.coolDown.html(Math.max(coolDown - count,0))
                this.$(".skill-image").addClass("used");
            } else {
                this.coolDown.hide();
                this.$(".skill-image").removeClass("used");
            }
            if ( !this.model.get("hideDuration") && this.model.get("duration")) {
                this.$(".skill-duration").html(this.model.get("duration")).show();
            } else {
                this.$(".skill-duration").hide();
            }
        }
    })

    exports.Skill = Backbone.Model.extend({
        modelClass:null,
        defaults:function(){
            return {
                name:"",
                type:"",
                displayName:"",
                level:1,
                maxLevel:5,
                currentCount:1000,
                coolDown:1,
                duration:0,
                hideDuration:false
            }
        },
        levelup:function(){
            this.set("level",this.get("level")+1);
        },
        generateDescription:function(){
            return "";
        },
        calCoolDown:function(){
            return Math.max(1, Math.round( this.getBasicCoolDown() * (1-window.COOLING_EFFECT/100*window.hero.get("cooling"))));
        },
        getBasicCoolDown:function(){
            return this.get("coolDown");
        },
        clone:function(){
            if ( this.modelClass != null )
                return new this.modelClass(window.clone(this.toJSON()))
            return null;
        },
        used:function(){
            this.set("currentCount",0);
        },
        onNewTurn:function(){
            if ( this.get("duration") )
                this.set("duration", this.get("duration") - 1);
            heroRace.adjustSkillDuration(this);

            var count = this.get("currentCount");
            if ( count < this.calCoolDown() ){
                this.set("currentCount", count+1);
                heroRace.adjustSkillCount(this);
            } else {
                this.set("currentCount", 1000); //set to very big
            }
        },
        attackBlock:function(x,y,direction, type){
            var block = getMapBlock(x,y);
            if ( block && block.type == "monster" ) {
                var monsterView = block.view;
                return monsterView.beAttacked(direction,window.hero.get("attack"), type);
//                setTimeout(function(){
//
//                },TIME_SLICE)
            }
            return false;
        }
    })

    exports.ConstitutionSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"constitution",
                type:"passive",
                displayName:"体质",
                level:1,
                maxLevel:1000
            }
        },
        generateDescription:function(){
            return "最大生命值加"+CONSTITUTION_EFFECT;
        },
        onGet:function(){
            window.hero.set("constitution", this.get("level"))
        }
    })

    exports.CunningSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"cunning",
                type:"passive",
                displayName:"聪明",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("cunning", this.get("level"))
        },
        generateDescription:function(){
            return "升级所需的经验值减少"+(CUNNING_EFFECT*this.get("level"))+"%";
        }
    })

    exports.RegenerationSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"regeneration",
                type:"passive",
                displayName:"再生",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("regeneration", this.get("level"))
        },
        generateDescription:function(){
            return "每回合开始恢复"+(REGENERATION_EFFECT*this.get("level"))+"<span class='hp-symbol'>♥</span>";
        }
    })

    exports.CoolingSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"cooling",
                type:"passive",
                displayName:"沉着",
                level:1,
                maxLevel:4
            }
        },
        onGet:function(){
            window.hero.set("cooling", this.get("level"))
        },
        generateDescription:function(){
            return "技能的冷却时间减少"+(COOLING_EFFECT*this.get("level"))+"%";
        }
    })

    exports.WisdomSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"wisdom",
                type:"passive",
                displayName:"智慧",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("wisdom", this.get("level"))
        },
        generateDescription:function(){
            return "杀死"+WISDOM_THRESHOLD+"级或以上怪物时多获得"+(WISDOM_EFFECT*this.get("level"))+"%的经验值";
        }
    })

    exports.RecoverSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"recover",
                type:"passive",
                displayName:"恢复",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("recover", this.get("level"))
        },
        generateDescription:function(){
            return "回复生命时多回复"+(this.get("level")*RECOVER_EFFECT)+"%生命";
        }
    })

    exports.TreasureHuntingSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"treasurehunting",
                type:"passive",
                displayName:"寻宝",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("treasureHunting", this.get("level"))
        },
        generateDescription:function(){
            return "杀死怪物掉落宝物的概率增加"+(this.get("level")*TREASURE_HUNTING_EFFECT)+"%";
        }
    })

    exports.DexteritySkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"dexterity",
                type:"passive",
                displayName:"敏捷",
                level:1,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("dexterity", this.get("level"))
        },
        generateDescription:function(){
            return "有"+(DIXTERITY_EFFECT*this.get("level"))+"%的概率躲过怪物的攻击";
        }
    })

    exports.SlashSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.SlashSkill
        },
        defaults:function(){
            return {
                name:"slash",
                type:"active",
                displayName:"顺劈",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:5,
                hideDuration:true
            }
        },
        generateDescription:function(){
            return "英雄下次攻击同时攻击被击中的怪物后面的一个怪物";
        },
        onActive:function(){
            this.set("duration",1);
            this.used();
        },
        onAttack:function(x,y, direction){
            var mx = x;
            var my = y;
            if ( this.get("duration") ){
                mx += increment[direction].x;
                my += increment[direction].y;
                var self = this;
                setTimeout(function(){
                    self.attackBlock(mx,my,direction,"melee skill");
                },TIME_SLICE);
            }
        }
    })

    exports.RevertSlashSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.RevertSlashSkill
        },
        defaults:function(){
            return {
                name:"revert-slash",
                type:"active",
                displayName:"拖刀计",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:10,
                hideDuration:true
            }
        },
        generateDescription:function(){
            return "英雄下次攻击同时攻击自己身后的一个怪物";
        },
        onActive:function(){
            this.set("duration",1);
            this.used();
        },
        onCheckAttack:function(x,y, direction){
            var mx = x;
            var my = y;
            if ( this.get("duration") ){
                var d = (direction+2)%4;
                mx += increment[d].x;
                my += increment[d].y;
                mx += increment[d].x;
                my += increment[d].y;
                var self = this;
                setTimeout(function(){
                    self.attackBlock(mx,my,d,"melee skill");
                },TIME_SLICE);
                return true;
            }
            return false;
        }
    })

    exports.WhirlSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.WhirlSkill
        },
        defaults:function(){
            return {
                name:"whirl",
                type:"active",
                displayName:"回旋斩",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "杀死英雄上下左右的4个怪物";
        },
        onActive:function(){
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            var totalHit = 0;
            for ( var i in [0,1,2,3]) {
                var mx = x + increment[i].x;
                var my = y + increment[i].y;
                var result = this.attackBlock(mx, my,i,"melee skill");
                if ( result )
                    totalHit++;
            }
            if ( totalHit == 4 ){
                statistic.skills[this.get("name")]=true;
            }
            this.used();
        }
    })

    exports.BigWhirlSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.BigWhirlSkill
        },
        defaults:function(){
            return {
                name:"big-whirl",
                type:"active",
                displayName:"大回旋斩",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:35
            }
        },
        generateDescription:function(){
            return "杀死英雄周围的8个怪物";
        },
        onActive:function(){
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            var totalHit = 0;
            var result = this.attackBlock(x-1, y-1,0,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x, y-1,0,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x+1, y-1,0,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x-1, y,3,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x+1, y,1,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x-1, y+1,2,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x, y+1,2,"melee skill");
            if ( result )
                totalHit++;
            result = this.attackBlock(x+1, y+1,2,"melee skill");
            if ( result )
                totalHit++;
            if ( totalHit == 8 ){
                statistic.skills[this.get("name")]=true;
            }
            this.used();
        }
    })

    exports.HorizontalSlashSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.HorizontalSlashSkill
        },
        defaults:function(){
            return {
                name:"horizontal-slash",
                type:"active",
                displayName:"横斩",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "杀死与英雄同一行的所有怪物"
        },
        onActive:function(){
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            var totalHit = 0;
            for ( var i = 0 ; i < x ; i++ ) {
                var result = this.attackBlock(i, y, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            for ( var i = x+1 ; i < mapWidth ; i++ ) {
                var result = this.attackBlock(i, y, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            this.used();
        }
    })

    exports.VerticalSlashSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.VerticalSlashSkill
        },
        defaults:function(){
            return {
                name:"vertical-slash",
                type:"active",
                displayName:"纵斩",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "杀死与英雄同一列的所有怪物"
        },
        onActive:function(){
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            var totalHit = 0;
            for ( var i = 0 ; i < y ; i++ ) {
                var result = this.attackBlock(x, i, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            for ( var i = y+1 ; i < mapHeight ; i++ ) {
                var result = this.attackBlock(x, i, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            this.used();
        }
    })

    exports.CrossSlashSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.CrossSlashSkill
        },
        defaults:function(){
            return {
                name:"cross-slash",
                type:"active",
                displayName:"十字斩",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:38
            }
        },
        generateDescription:function(){
            return "杀死与英雄同一行和同一列的所有怪物"
        },
        onActive:function(){
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            var totalHit = 0;
            for ( var i = 0 ; i < x ; i++ ) {
                var result = this.attackBlock(i, y, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            for ( var i = x+1 ; i < mapWidth ; i++ ) {
                var result = this.attackBlock(i, y, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            for ( var i = 0 ; i < y ; i++ ) {
                var result = this.attackBlock(x, i, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            for ( var i = y+1 ; i < mapHeight ; i++ ) {
                var result = this.attackBlock(x, i, 0, "melee skill");
                if ( result )
                    totalHit++;
            }
            this.used();
        }
    })

    //priest skill
    exports.HealSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.HealSkill
        },
        defaults:function(){
            return {
                name:"heal",
                type:"active",
                displayName:"治疗术",
                level:1,
                maxLevel:5,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "+"+this.getEffect()+"<span class='hp-symbol'>♥</span>且解毒（可被恢复技能影响）"
        },
        onActive:function(){
            window.heroView.getHp(this.getEffect());
            window.heroView.curePoison();
            this.used();
        },
        getEffect:function(level){
            level = level || this.get("level")
            return 5+level*5;
        }
    })

    exports.DispelSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.DispelSkill
        },
        defaults:function(){
            return {
                name:"dispel",
                type:"active",
                displayName:"驱魔",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:5
            }
        },
        generateDescription:function(){
            return "去除所有对英雄不利和对怪物有利的状态"
        },
        onActive:function(){
            var score = 0;
            if ( hero.get("poison") )
                score++;
            if ( hero.get("freeze") )
                score++;
            if ( hero.get("dizzy") )
                score++;
            if ( hero.get("cursed") )
                score++;
            window.hero.set({
                poison:0,
                freeze:0,
                dizzy:0,
                cursed:0
            })
            for ( var y = 0; y < mapHeight; y++  ){
                for ( var x = 0; x < mapWidth; x++) {
                    var block = getMapBlock(x,y);
                    if ( block && block.type == "monster" ) {
                        var model = block.model;
                        if ( model ) {
                            if ( model.get("angry") )
                                score++;
                            model.set({
                                angry: 0
                            })
                        }
                    }
                }
            }
            hero.getScore(score);
            this.used();
        }
    })

    exports.HolyShieldSkill = exports.Skill.extend({
        initialize: function () {
            this.modelClass = exports.HolyShieldSkill
        },
        defaults: function () {
            return {
                name: "holy-shield",
                type: "active",
                displayName: "圣盔甲",
                level: 1,
                maxLevel: 3,
                currentCount: 1000,
                coolDown: 24
            }
        },
        generateDescription: function () {
            return "只受一半伤害(向下取整)。持续"+this.getEffect()+"回合"
        },
        onActive:function(){
            this.set("duration",this.getEffect());
            this.used();
        },
        adjustDamage:function(damage, type){
            if ( this.get("duration") ) {
                return Math.floor(damage/2);
            } else
                return damage;
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return 2+l;
        }
    })

    exports.ConfuseUndeadSkill = exports.Skill.extend({
        initialize: function () {
            this.modelClass = exports.ConfuseUndeadSkill
        },
        defaults: function () {
            return {
                name: "confuse-undead",
                type: "active",
                displayName: "操控亡灵",
                level: 1,
                maxLevel: 5,
                currentCount: 1000,
                coolDown: 18
            }
        },
        generateDescription: function () {
            return "不死生物不会攻击英雄（boss除外）。持续"+this.getEffect()+"回合"
        },
        onActive:function(){
            this.set("duration",this.getEffect());
            this.used();
        },
        adjustRange:function( type,range){
            if ( this.get("duration") ) {
                if ( type ) {
                    if ( type.contains("undead") )
                        return null;
                    return range;
                }
                return range;
            } else
                return range;
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return 2+l;
        }
    })

    exports.ResurrectionSkill = exports.Skill.extend({
        initialize: function () {
            this.modelClass = exports.ResurrectionSkill
        },
        defaults: function () {
            return {
                name: "resurrection",
                type: "active",
                displayName: "复活术",
                level: 1,
                maxLevel: 4,
                currentCount: 1000,
                coolDown: 60,
                hideDuration:true
            }
        },
        generateDescription: function () {
            return "如果本轮死亡，将以"+(20*this.get("level"))+"%生命复活"
        },
        onDying : function() {
            if ( this.get("duration") ) {
                hero.set("hp",Math.floor(hero.get("maxHp")*0.2*this.get("level")));
            }
        },
        onActive:function(){
            this.set("duration",1);
            this.used();
        }
    })

    exports.TurnUndeadSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.TurnUndeadSkill
        },
        defaults:function(){
            return {
                name:"turn-undead",
                type:"active",
                displayName:"超度亡灵",
                level:1,
                maxLevel:3,
                currentCount:1000,
                coolDown:50
            }
        },
        generateDescription:function(){
            var str = "消灭所有不死生物（不包括boss）"
            str += this.get("level") > 1 ? "，冷却时间减少-5" : "";
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") - ( this.get("level") - 1 )* 5;
        },
        onActive:function(){
            var totalHit = 0;
            for ( var y = 0; y < mapHeight; y++  ){
                for ( var x = 0; x < mapWidth; x++) {
                    var block = getMapBlock(x,y);
                    if ( block && block.type == "monster" && block.model.get("isUndead") ) {
                        var monsterView = block.view;
                        var result = monsterView.beAttacked(0,window.hero.get("attack"), "magic skill");
                        if ( result )
                            totalHit++;
                    }
                }
            }
            if ( totalHit >= 15 ){
                statistic.skills[this.get("name")]=true;
            }
            this.used();
        }
    })

    //wizard skill
    exports.MagicMissileSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.MagicMissileSkill
        },
        defaults:function(){
            return {
                name:"magic-missile",
                type:"active",
                displayName:"魔导弹",
                level:1,
                maxLevel:3,
                currentCount:1000,
                coolDown:8
            }
        },
        generateDescription:function(){
            var str = "随机攻击英雄周围的"+this.getEffect()+"个怪物";
            if ( this.get("level") > 1 ){
                str += "，但是冷却时间＋２"
            }
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") + ( this.get("level") - 1 )* 2;
        },
        onActive:function(){
            var totalHit = 0;
            var candidate = [];
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            for ( var i = x-1 ; i <= x+1 ; i++ ) {
                for ( var j = y-1 ; j <= y+1 ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "monster" ) {
                        var monsterView = block.view;
                        candidate.push(monsterView)
                    }
                }
            }

            var killList = getRandomItems(candidate, this.getEffect());
            _.each(killList, function(monsterView){
                var result = monsterView.beAttacked(0,window.hero.get("attack"), "magic skill");
                if ( result )
                    totalHit++;
            },this)
            hero.getScore(totalHit)
            this.used();
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return l;
        }
    })
    exports.SpiderWebSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.SpiderWebSkill
        },
        defaults:function(){
            return {
                name:"spider-web",
                type:"active",
                displayName:"蛛网术",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "所有怪物不能移动1回合"
        },
        onActive:function(){
            var totalHit = 0;
            for ( var i = 0 ; i < mapWidth ; i++ ) {
                for ( var j = 0 ; j < mapWidth ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type == "monster" ) {
                        var monsterView = block.view;
                        var result = monsterView.getFreeze(1);
                        if ( result )
                            totalHit++;
                    }
                }
            }
            hero.getScore(totalHit)
            this.used();
        }
    })
    exports.TeleportSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.TeleportSkill
        },
        defaults:function(){
            return {
                name:"teleport",
                type:"active",
                displayName:"传送术",
                level:1,
                maxLevel:1,
                currentCount:1000,
                coolDown:20
            }
        },
        generateDescription:function(){
            return "英雄随机传送到另一个空白的格子";
        },
        onActive:function(){
            var totalHit = 0;
            var candidate = [];
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "blank" ) {
                        candidate.push(block)
                    }
                }
            }

            if ( candidate.length > 0 ) {
                var block = getRandomItem(candidate);
                window.heroView.setToPosition(block.x,block.y)

                //又入虎穴
                var monsterCount = 0;
                for ( var i = block.x-1 ; i <= block.x+1 ; i++ ) {
                    for ( var j = block.y-1 ; j <= block.y+1 ; j++ ) {
                        var b = getMapBlock(i,j);
                        if ( b && b.type === "monster" ) {
                            monsterCount++;
                        }
                    }
                }
                if ( monsterCount == 8 ){
                    statistic.skills[this.get("name")]=true;
                }
            }
            this.used();
        }
    })

    exports.ShapeShiftSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.ShapeShiftSkill
        },
        defaults:function(){
            return {
                name:"shape-shift",
                type:"active",
                displayName:"变形术",
                level:1,
                maxLevel:4,
                currentCount:1000,
                coolDown:18
            }
        },
        generateDescription:function(){
            var str = "将房间里所有的某1种怪物变为房间里的另1种怪物";
            if ( this.get("level") > 1 ) {
                str += "，冷却时间-2"
            }
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") - ( this.get("level") - 1 )* 2;
        },
        onActive:function(){
            var totalHit = 0;
            var types = {};
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var b = getMapBlock(i,j);
                    if ( b && b.type === "monster" ) {
                        types[b.model.get("type")] = 1;
                    }
                }
            }
            var keys = [];
            for ( var key in types ){
                keys.push(key)
            }
            if ( keys.length > 1 ) {
                var twoTypes = getRandomItems(keys,2);
                var fromType = twoTypes[0];
                var toType = twoTypes[1];
                for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                    for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                        var b = getMapBlock(i,j);
                        if ( b && b.type === "monster" ) {
                            if (b.model.get("type") == fromType){
                                totalHit++;
                                var level = b.model.get("level");
                                var freeze = b.model.get("freeze");
                                var angry = b.model.get("angry");
                                b.model.destroy();
                                b.model = null;
                                b.view = null;
                                roomView.createOneMonster(toType, i, j, level);
                                b.model.set({
                                    freeze:freeze,
                                    angry:angry
                                })
                            }
                        }
                    }
                }

                hero.getScore(totalHit);
            }
            this.used();
        }
    })

    exports.LighteningChainSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.LighteningChainSkill
        },
        defaults:function(){
            return {
                name:"lightening-chain",
                type:"active",
                displayName:"闪电链",
                level:1,
                maxLevel:4,
                currentCount:1000,
                coolDown:40
            }
        },
        generateDescription:function(){
            var str = "随机杀死英雄周围的"+this.getEffect()+"个怪物和与之同名的所有怪物";
            if ( this.get("level") > 1 ) {
                str += "，但冷却时间＋4"
            }
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") + ( this.get("level") - 1 )* 4;
        },
        onActive:function(){
            var totalHit = 0;
            var candidate = [];
            var x = window.hero.get("position").x;
            var y = window.hero.get("position").y;
            for ( var i = x-1 ; i <= x+1 ; i++ ) {
                for ( var j = y-1 ; j <= y+1 ; j++ ) {
                    var b = getMapBlock(i,j);
                    if ( b && b.type === "monster" ) {
                        candidate.push({
                            type: b.view.model.get("type"),
                            d: 0
                        })
                    }
                }
            }

            if ( candidate.length > 0 ) {
                var attList = getRandomItems(candidate, this.getEffect() );
                _.each(attList,function(att){
                    totalHit += this.killAllInType(att.type,att.d,"magic skill");
                },this)
            }
            hero.getScore(totalHit);
            if ( totalHit >= 15 && this.checkAllDead())
                statistic.skills[this.get("name")]=true;
            this.used();
        },
        killAllInType:function(monsterType, direction, type){
            var total = 0;
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "monster" ) {
                        var monsterView = block.view;
                        if ( monsterView.model.get("type") == monsterType ) {
                            var result = monsterView.beAttacked(direction,window.hero.get("attack"), "magic skill");
                            if ( result )
                                total++
                        }
                    }
                }
            }
            return total;
        },
        checkAllDead:function(){
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "monster" ) {
                        return false;
                    }
                }
            }
            return true;
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return l;
        }
    })

    exports.MeteorShowersSkill = exports.Skill.extend({
        initialize: function () {
            this.modelClass = exports.MeteorShowersSkill
        },
        defaults: function () {
            return {
                name: "meteor-showers",
                type: "active",
                displayName: "流星雨",
                level: 1,
                maxLevel: 5,
                currentCount: 1000,
                coolDown: 25
            }
        },
        generateDescription: function () {
            var str = "以"+this.getEffect()+"%的概率随机杀死每个怪物";
            if (this.get("level") > 1) {
                str += "，但冷却时间＋5"
            }
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") + ( this.get("level") - 1 )* 5;
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return l*15+5;
        },
        onActive:function(){
            var totalHit = 0;
            var rate = this.getEffect()/100;
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "monster" && Math.random() < rate ) {
                        var monsterView = block.view;
                        var result = monsterView.beAttacked(0,window.hero.get("attack"), "magic skill");
                        if ( result )
                            totalHit++
                    }
                }
            }

            hero.getScore(totalHit);
            if ( totalHit >= 15 && this.checkAllDead())
                statistic.skills[this.get("name")]=true;
            this.used();
        },
        checkAllDead:function(){
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "monster" ) {
                        return false;
                    }
                }
            }
            return true;
        }
    });

    exports.TelekinesisSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.TelekinesisSkill
        },
        defaults:function(){
            return {
                name:"telekinesis",
                type:"active",
                displayName:"隔空取物",
                level:1,
                maxLevel:3,
                currentCount:1000,
                coolDown:15
            }
        },
        generateDescription:function(){
            var str = "随机取得地图上的"+this.getEffect()+"个宝物";
            return str;
        },
        getEffect:function(level){
            var l = level || this.get("level");
            return l;
        },
        onActive:function(){
            var candidate = [];
            for ( var i = 0 ; i < window.mapWidth ; i++ ) {
                for ( var j = 0 ; j < window.mapHeight ; j++ ) {
                    var block = getMapBlock(i,j);
                    if ( block && block.type === "item" ) {
                        candidate.push(block)
                    }
                }
            }
            if ( candidate.length ) {
                hero.getScore(candidate.length);
                var blocks = getRandomItems(candidate, this.getEffect())
                _.each(blocks, function(block){
                    var itemView = block.view;
                    var x = hero.get("position").x;
                    var y = hero.get("position").y;
                    itemView.$el.css({transition: "all "+(TIME_SLICE*4/5000)+"s ease-in-out 0s", left:x*blockSize.width,
                        top:y*blockSize.width,
                        transform:"scale(0.6)"});
                    var self = this;
                    setTimeout(function(){
                        itemView.beTaken();
                    },1+TIME_SLICE*4/5)

                    block.view = null;
                    block.model = null;
                    block.type = "blank";
                })
            }

            this.used();
        }
    });

    exports.StealthSkill = exports.Skill.extend({
        initialize:function() {
            this.modelClass = exports.TelekinesisSkill
        },
        defaults:function(){
            return {
                name:"stealth",
                type:"active",
                displayName:"隐身",
                level:1,
                maxLevel:3,
                currentCount:1000,
                coolDown:24
            }
        },
        generateDescription:function(){
            var str = "持续"+this.getEffect()+"回合，所有怪物不攻击英雄";
            if ( this.get("level") > 1 ) {
                str+="但冷却时间+4";
            }
            return str;
        },
        getBasicCoolDown:function(){
            return this.get("coolDown") + ( this.get("level") - 1 )* 4;
        },

        getEffect:function(level){
            var l = level || this.get("level");
            return l+1;
        },
        onActive:function(){
            this.set("duration",this.getEffect());
            this.used();
        },
        adjustRange:function( type,range){
            if ( this.get("duration") ) {
                return null;
            } else
                return range;
        }
    });

    exports.initSkillPool = function(){
        initSkillConst();

        exports.commonSkillPoolEntry = [
            exports.ConstitutionSkill,
            exports.CunningSkill,
            exports.DexteritySkill,
            exports.CoolingSkill,
            exports.WisdomSkill,
            exports.TreasureHuntingSkill,
            exports.RecoverSkill
        ]

        exports.warriorBasicSkillPoolEntry = [
            exports.SlashSkill,
            exports.WhirlSkill
        ]

        exports.priestBasicSkillPoolEntry = [
            exports.HealSkill,
            exports.DispelSkill
        ]

        exports.wizardBasicSkillPoolEntry = [
            exports.SpiderWebSkill,
            exports.MagicMissileSkill
        ]

        exports.thiefBasicSkillPoolEntry = [
            exports.StealthSkill,
            exports.TelekinesisSkill
        ]
    }

    exports.getSkillPool = function(type){
        var array = [];
        _.each(exports.commonSkillPoolEntry, function(skill){
             var s = new skill();
             s.modelClass = skill;
             array.push(s)
        });
        var pool2 = exports[type+"BasicSkillPoolEntry"];
        if ( pool2 ) {
            _.each( pool2, function(skill){
                var s = new skill();
                s.modelClass = skill;
                array.push(s)
            });
        }

//        array = [new exports.BigWhirlSkill(),
//            new exports.WhirlSkill()]

        return array;
    }
})