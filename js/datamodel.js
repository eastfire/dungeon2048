define(function (require, exports, module) {
    exports.Hero = Backbone.Model.extend({
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3,

        defaults: function () {
            return {
                name:"player",
                race: "human",
                type: "warrior",
                score: 0,
                level: 1,
                exp: 0,
                maxExp: 10,
                hp: 10,
                maxHp: 10,
                attack: 1,
                defend: 0,
                direction: 2,
                skillSlot:2,
                position: {
                    x: 2,
                    y: 2
                },
                constitution: 0,
                cunning: 0,
                wisdom: 0,
                dexterity: 0,
                cooling: 0,
                recover: 0,
                treasureHunting: 0
            }
        },
        initialize: function () {
            this.on("change:constitution", this.onConstitutionChange, this);
            this.on("change:cunning", this.onCunningChange, this);
            this.expUnused = 0;
        },
        getExp: function (exp, level) {
            if (level >= WISDOM_THRESHOLD) {
                exp += Math.round(exp * this.get("wisdom") * WISDOM_EFFECT / 100);
            }
            if (level) {
                this.getScore(exp);
            }
            if ( this.expUnused == 0 ) {
                this.expUnused += exp;
                this.checkLevelUp();
            } else {
                this.expUnused += exp;
            }
        },
        getScore:function(score){
            this.set("score",this.get("score")+score);
        },
        checkLevelUp:function(){
            var currentExp = this.get("exp");
            var expRequire = this.get("maxExp");
            if (currentExp + this.expUnused >= expRequire) {
                this.levelUp();
                this.expUnused -= ( expRequire - currentExp );
                var self = this;
                window.showLevelUpDialog(function(){
                    self.checkLevelUp();
                })
            } else {
                this.set("exp", currentExp + this.expUnused);
                this.expUnused = 0;
            }
        },
        levelUp: function () {
            var newLevel = this.get("level") + 1;
            var newMaxHp = this.calMaxHp(newLevel)
            this.set({
                exp: 0,
                level: newLevel,
                maxHp: newMaxHp,
                hp: newMaxHp,
                maxExp: this.calExpRequire(newLevel),
                poison: 0
            })
        },
        calExpRequire: function (lv) {
            return Math.round((Math.log10(lv) * lv * 16.61 + 10) * (1 - (CUNNING_EFFECT / 100) * this.get("cunning")));
        },
        onConstitutionChange: function () {
            var maxHp = this.calMaxHp(this.get("level"));
            this.set({
                hp: ( this.get("constitution") - this.previous("constitution") ) * CONSTITUTION_EFFECT + this.get("hp"),
                maxHp: maxHp
            });
        },
        onCunningChange: function () {
            this.set({
                maxExp: this.calExpRequire(this.get("level"))
            });
        },
        calMaxHp: function (lv) {
            return lv * 10 + this.get("constitution") * CONSTITUTION_EFFECT;
        },
        isPositionNear:function(x,y){
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
            if ( attackDirection == null )
                return null;
            return {direction:attackDirection};
        }
    })

    exports.Monster = Backbone.Model.extend({
        defaults: function () {
            return {
                type: "slime",
                level: 1,
                exp: 1,
                attack: 1,
                hp: 1,
                defend: 0,
                attackType: "melee normal",
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2,
                angry: 0
            }
        },
        initialize: function () {
            this.setToLevel(this.get("level"));
        },
        setToLevel: function (level) {
            this.set({
                level: level,
                attack: this.calAttack(level),
                exp: this.calExp(level)
            })
        },
        calAttack: function (level) {
            return level;
        },
        calExp: function (level) {
            return level;
        },
        onHitHero: function () {

        },
        getFreezePower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.freeze, 96 ) / 100;
            return 0;
        },
        getDizzyPower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.dizzy, 100 ) / 100;
            return 0;
        },
        mergeStatus: function (mergeToModel) {
            if (mergeToModel.get("angry")) {
                this.set("angry", mergeToModel.get("angry"))
            }
        }
    })

    exports.Boss = exports.Monster.extend({
        defaults:function(){
            var ret = exports.Monster.prototype.defaults.call(this);
            ret.subType = "boss";
            return ret;
        }
    })

    exports.Archer = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.attackType = "range normal";
            data.isUndead = true;
            return data;
        },
        calAttack: function (level) {
            return 1;
        },
        calExp: function (level) {
            return Math.floor(level * 3 / 2);
        }
    })

    exports.Ghost = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.isUndead = true;
            return data;
        },
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return Math.floor(level * 5 / 2);
        },
        getDodgePower:function(){
            return Math.min( this.get("level")*gameStatus.monsterPower.dodge , 66)/100;
        }
    })

    exports.Goblin = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        }
    })

    exports.Medusa = exports.Monster.extend({
        calExp: function (level) {
            return level*3-1;
        },
        getFreezePower:function(){
            return Math.min( this.get("level") * gameStatus.monsterPower.freeze, 96 ) / 100;
        }
    })

    exports.Mimic = exports.Monster.extend({
        calExp: function (level) {
            return 1;
        }
    })

    exports.Minotaur = exports.Monster.extend({
        calAttack: function (level) {
            return level * level;
        },
        calExp: function (level) {
            return level * level;
        }
    })

    exports.Ogre = exports.Monster.extend({
        calAttack: function (level) {
            return level * 2;
        },
        calExp: function (level) {
            return 3 * level - 1;
        }
    })

    exports.Orc = exports.Monster.extend({
        calExp: function (level) {
            return level * 2 - 1;
        }
    })

    exports.Shaman = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return Math.round(level * 3 / 2);
        }
    })

    exports.Skeleton = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.isUndead = true;
            return data;
        },
        calExp: function (level) {
            return Math.floor(level * 3 / 2);
        }
    })

    exports.Slime = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        }
    })

    exports.Snake = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return level * 2 - 1;
        },
        onHitHero: function () {
            if (!window.hero.get("poison"))
                window.hero.set("poison", 1);
        }
    })

    exports.Troll = exports.Monster.extend({
        calAttack: function (level) {
            return level * 2;
        },
        calExp: function (level) {
            return level * 4;
        },
        getDizzyPower:function(){
            return Math.min( this.get("level") * gameStatus.monsterPower.dizzy, 100 ) / 100;
        }
    })

    exports.Vampire = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.isUndead = true;
            return data;
        },
        calAttack: function (level) {
            return level * level;
        },
        calExp: function (level) {
            return level * level;
        },
        onHitHero: function () {
            this.setToLevel(this.get("level") + 1);
        }
    })

    exports.BossBeholder = exports.Boss.extend({
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")/3);
        },
        calExp: function (level) {
            return Math.floor(window.hero.get("maxExp") * 2 / 3);
        },
        getFreezePower:function(){
            return 100;
        },
        getDizzyPower:function(){
            return 100;
        }
    })

    exports.BossDeath = exports.Boss.extend({
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")/2);
        },
        calExp: function (level) {
            return Math.floor(window.hero.get("maxExp") / 2);
        }
    })

    exports.BossHydra = exports.Boss.extend({
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")/4);//it will be double
        },
        calExp: function (level) {
            return window.hero.get("maxExp");
        }
    })

    exports.ModelMap = {
        archer: exports.Archer,
        ghost: exports.Ghost,
        goblin: exports.Goblin,
        medusa: exports.Medusa,
        mimic: exports.Mimic,
        ogre: exports.Ogre,
        orc: exports.Orc,
        shaman: exports.Shaman,
        skeleton: exports.Skeleton,
        slime: exports.Slime,
        snake: exports.Snake,
        troll: exports.Troll,
        vampire: exports.Vampire,
        minotaur: exports.Minotaur,

        "boss-beholder":exports.BossBeholder,
        "boss-death":exports.BossDeath,
        "boss-hydra":exports.BossHydra
    }

    exports.Item = Backbone.Model.extend({
        defaults: function () {
            return {
                type: "potion",
                level: 1,
                effect: 1,
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2
            }
        },
        initialize: function (options) {
            this.setToLevel(options.level)
        },
        setToLevel: function (level) {
            this.set({
                level: level,
                effect: this.calEffect(level)
            })
        },
        calEffect:function(level){
            return level * (level + 1) / 2;
        },
        effectHappen: function () {
            if (this.get("type") == "potion") {
                window.heroView.getHp(this.get("effect"));
            }
        }
    })
});