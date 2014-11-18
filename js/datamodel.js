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
                baseHp: 10,
                selectableSkillNumber: 2,
                constitution: 0,
                cunning: 0,
                wisdom: 0,
                dexterity: 0,
                cooling: 0,
                recover: 0,
                concentrate: 0,
                treasureHunting: 0,
                regeneration: 0
            }
        },
        initialize: function () {
            this.on("change:constitution", this.onConstitutionChange, this);
            this.on("change:cunning", this.onCunningChange, this);
            this.expUnused = 0;
            this.set({
                "hp":this.calMaxHp(this.get("level")),
                "maxHp":this.calMaxHp(this.get("level"))
            });
        },
        getExp: function (exp, level) {
            if (level >= WISDOM_THRESHOLD) {
                exp += Math.round(exp * this.get("wisdom") * WISDOM_EFFECT / 100);
            }
            if ( level >= 3*WISDOM_THRESHOLD )
                this.getScore(exp);
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
                poison: 0,
                cursed: 0
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
            return lv * LEVELUP_HP_EFFECT + this.get("constitution") * CONSTITUTION_EFFECT + this.get("baseHp");
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
        },
        isInRange:function(x,y,range){
            var heroX = window.hero.get("position").x;
            var heroY = window.hero.get("position").y;
            if ( Math.abs(x-heroX) + Math.abs(y-heroY) <= range ) {
                return true;
            }
            return false
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
        getCursePower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.curse, 80 ) / 100;
            return 0;
        },
        getDizzyPower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.dizzy, 100 ) / 100;
            return 0;
        },
        getLockPower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.lock, 100 ) / 100;
            return 0;
        },
        getDisturbPower:function(){
            if ( gameStatus.globalEffect.madness )
                return Math.min( this.get("level") * gameStatus.monsterPower.disturb, 80 ) / 100;
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
            data.attackType = "range normal undead";
            data.isUndead = true;
            data.range = 3;
            return data;
        },
        calAttack: function (level) {
            return Math.ceil(level/4);
        },
        calExp: function (level) {
            return Math.floor(level * 3 / 2);
        }
    })

    exports.Gargoyle = exports.Monster.extend({
        calExp: function (level) {
            return level * 2 + 1;
        },
        getLockPower:function(){
            return Math.min( this.get("level")*gameStatus.monsterPower.lock , 100)/100;
        }
    })

    exports.Ghost = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.attackType = "melee normal undead";
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

    exports.Golem = exports.Monster.extend({
        calAttack: function (level) {
            return level*level;
        },
        calExp: function (level) {
            return level*level+2;
        }
    })

    exports.Kobold = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return level * 2;
        },
        getDisturbPower:function(){
            return Math.min( this.get("level")*gameStatus.monsterPower.disturb , 80)/100;
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

    exports.Mummy = exports.Monster.extend({
        calExp: function (level) {
            return level * 2;
        },
        getCursePower:function(){
            return Math.min( this.get("level") * gameStatus.monsterPower.curse, 80 ) / 100;
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

    exports.RatMan = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return Math.floor(level * 5 / 2);
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
            data.attackType = "melee normal undead";
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
            window.heroView.getPoison( Math.ceil(this.get("level")/4));
        }
    })

    exports.Troll = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.attackType = "range normal";
            data.range = 3;
            return data;
        },
        calAttack: function (level) {
            return level;
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
            data.attackType = "melee normal undead";
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
            return Math.floor(window.hero.get("maxHp")*2/ 3);
        },
        getFreezePower:function(){
            return 100;
        },
        getDizzyPower:function(){
            return 100;
        },
        getDisturbPower:function(){
            return 100;
        },
        getLockPower:function(){
            return 100;
        }
    })

    exports.BossDeath = exports.Boss.extend({
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")*2/3);
        },
        calExp: function (level) {
            return Math.floor(window.hero.get("maxHp")*2/3);
        }
    })

    exports.BossHydra = exports.Boss.extend({
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")/4);//it will be double
        },
        calExp: function (level) {
            return Math.floor(window.hero.get("maxHp")/2);
        }
    })

    exports.BossLich = exports.Boss.extend({
        defaults:function(){
            var data = exports.Boss.prototype.defaults.call(this);
            data.attackType = "range normal";
            data.range = 1000;
            return data;
        },
        calAttack: function (level) {
            return Math.floor(window.hero.get("maxHp")/8);
        },
        calExp: function (level) {
            return Math.floor(window.hero.get("maxHp")/2);
        }
    })

    exports.ModelMap = {
        archer: exports.Archer,
        gargoyle: exports.Gargoyle,
        ghost: exports.Ghost,
        goblin: exports.Goblin,
        golem: exports.Golem,
        kobold: exports.Kobold,
        medusa: exports.Medusa,
        mimic: exports.Mimic,
        mummy: exports.Mummy,
        ogre: exports.Ogre,
        orc: exports.Orc,
        "rat-man":exports.RatMan,
        shaman: exports.Shaman,
        skeleton: exports.Skeleton,
        slime: exports.Slime,
        snake: exports.Snake,
        troll: exports.Troll,
        vampire: exports.Vampire,
        minotaur: exports.Minotaur,

        "boss-beholder":exports.BossBeholder,
        "boss-death":exports.BossDeath,
        "boss-hydra":exports.BossHydra,
        "boss-lich":exports.BossLich
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
            if (this.get("type") == "potion") {
                return level * (level + 1);
            } else if (this.get("type") == "mana-potion") {
                return level * (level+1)/2;
            }
        },
        effectHappen: function () {
            if (this.get("type") == "potion") {
                window.heroView.getHp(this.get("effect"));
                window.heroView.curePoison();
            } else if (this.get("type") == "mana-potion") {
                window.heroView.getCoolDown(this.get("effect"));
            }
        }
    })

    exports.Terrain = Backbone.Model.extend({
        defaults: function () {
            return {
                type: "pillar",
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2,
                canPass: true,
                canGenerateIn: true,
                canCatch: false
            }
        }
    })

    exports.PillarTerrain = exports.Terrain.extend({
        defaults: function () {
            return {
                type: "pillar",
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2,
                canPass: false,
                canGenerateIn: false,
                canCatch: false
            }
        }
    })

    exports.PitTerrain = exports.Terrain.extend({
        defaults: function () {
            return {
                type: "pit",
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2,
                canPass: true,
                canGenerateIn: true,
                canCatch: true
            }
        }
    })

    exports.TrapTerrain = exports.Terrain.extend({
        defaults: function () {
            return {
                type: "trap",
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2,
                canPass: true,
                canGenerateIn: true,
                canCatch: true
            }
        },
        onBeforeTurnEnd:function(block){
            if ( block.type == "monster" ) {
                block.model.destroy();
                block.model = null;
                block.view = null;
                block.type = "blank";
                return false;
            } else if ( block.type == "hero" ){
                gameStatus.killBy = {
                    type :"trap"
                }
                window.heroView.takeDamage(Math.ceil(window.hero.get("maxHp")/20),"trap");
                return false;
            }
            return true;
        }
    })

    exports.terrainMap = {
        pillar: exports.PillarTerrain,
        pit: exports.PitTerrain,
        trap: exports.TrapTerrain,
        campfire: exports.Terrain
    }
});