define(function(require,exports,module) {
    exports.SkillView = Backbone.View.extend({

    })

    exports.Skill = Backbone.Model.extend({
        defaults:function(){
            return {
                type:"",
                displayName:"",
                level:0,
                maxLevel:5
            }
        },
        getDescription:function(){
            if ( this.get("description") )
                return this.get("description");
            else
                return this.generateDescription();
        },
        generateDescription:function(){
            return "";
        }
    })

    exports.ConstitutionSkill = exports.Skill.extend({
        defaults:function(){
            return {
                type:"constitution",
                displayName:"体质",
                level:0,
                maxLevel:5,
                description:"生命值上限加5"
            }
        },

        onGet:function(){
            window.hero.set("constitute", this.get("level"))
        }
    })

    exports.CunningSkill = exports.Skill.extend({
        defaults:function(){
            return {
                type:"cunning",
                displayName:"聪明",
                level:0,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("cunning", this.get("level"))
        },
        generateDescription:function(){
            return "升级所需的经验值减少"+(5*this.get("level"))+"%";
        }
    })

    exports.CoolingSkill = exports.Skill.extend({
        defaults:function(){
            return {
                type:"cooling",
                displayName:"沉着",
                level:0,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("cooling", this.get("level"))
        },
        generateDescription:function(){
            return "技能的冷却时间减少"+(5*this.get("level"))+"%";
        }
    })

    exports.WisdomSkill = exports.Skill.extend({
        defaults:function(){
            return {
                type:"wisdom",
                displayName:"智慧",
                level:0,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("wisdom", this.get("level"))
        },
        generateDescription:function(){
            return "杀死5级以上怪物时多获得"+(5*this.get("level"))+"%的经验值";
        }
    })

    exports.DexteritySkill = exports.Skill.extend({
        defaults:function(){
            return {
                type:"dexterity",
                displayName:"敏捷",
                level:0,
                maxLevel:5
            }
        },
        onGet:function(){
            window.hero.set("dexterity", this.get("level"))
        },
        generateDescription:function(){
            return "有"+(5*this.get("level"))+"%的概率躲过怪物的攻击";
        }
    })

    exports.commonSkillPoolEntry = [
        {
            viewClass: exports.SkillView,
            modelClass: exports.ConstitutionSkill
        },
        {
            viewClass: exports.SkillView,
            modelClass: exports.CunningSkill
        },
        {
            viewClass: exports.SkillView,
            modelClass: exports.DexteritySkill
        },{
            viewClass: exports.SkillView,
            modelClass: exports.CoolingSkill
        },
        {
            viewClass: exports.SkillView,
            modelClass: exports.WisdomSkill
        }
    ]

    exports.getCommonSkillPool = function(){
        return _.map(genSkill, exports.commonSkillPoolEntry)
    }

    var genSkill = function(entry){
        return {
            viewClass: entry.viewClass,
            model: new entry.modelClass()
        }
    }
})