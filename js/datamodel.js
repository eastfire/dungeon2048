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
                typeDisplayName: "战士",
                score: 0,
                level: 1,
                exp: 0,
                maxExp: 10,
                hp: 10,
                maxHp: 10,
                attack: 1,
                defend: 0,
                direction: 2,
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
                this.set("score", this.get("score") + exp);
            }
            if ( this.expUnused == 0 ) {
                this.expUnused += exp;
                this.checkLevelUp();
            } else {
                this.expUnused += exp;
            }
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
                paralysis: 0
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
        mergeStatus: function (mergeToModel) {
            if (mergeToModel.get("angry")) {
                this.set("angry", mergeToModel.get("angry"))
            }
        }
    })

    exports.Archer = exports.Monster.extend({
        defaults:function(){
            var data = exports.Monster.prototype.defaults.call(this);
            data.attackType = "range normal";
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
        calAttack: function (level) {
            return Math.round(level / 2);
        },
        calExp: function (level) {
            return Math.floor(level * 5 / 2);
        }
    })

    exports.Goblin = exports.Monster.extend({
        calAttack: function (level) {
            return Math.round(level / 2);
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

    exports.Vampire = exports.Monster.extend({
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


    exports.ModelMap = {
        archer: exports.Archer,
        ghost: exports.Ghost,
        goblin: exports.Goblin,
        mimic: exports.Mimic,
        ogre: exports.Ogre,
        orc: exports.Orc,
        shaman: exports.Shaman,
        skeleton: exports.Skeleton,
        slime: exports.Slime,
        snake: exports.Snake,
        vampire: exports.Vampire,
        minotaur: exports.Minotaur
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
        initialize: function () {

        },
        setToLevel: function (level) {
            this.set({
                level: level,
                effect: level * (level - 1)
            })
        },
        effectHappen: function () {
            if (this.get("type") == "potion") {
                window.heroView.getHp(this.get("effect"));
            }
        }
    })
});