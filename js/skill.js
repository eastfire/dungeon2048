define(function(require,exports,module) {
    exports.SkillView = Backbone.View.extend({
        initialize:function(options){
            if ( options.mode == "select" ) {
                this.$el.addClass("skill");
                this.$el.html("<span class='skill-image-icon'>" +
                    "<div class='skill-image skill-image-"+this.model.get("name")+"'></div></span>" +
                    "<span class='skill-description'>" +
                    "<div class='skill-level'>"+this.model.get("displayName")+"lv" + this.model.get("level") + "</div>" +
                    "<label class='skill-text'>"+this.model.generateDescription()+"</label>" +
                    "</span>")
                this.$el.css({
                    "font-size":blockSize.height/5+"px"
                })
                var image = this.$(".skill-image");
                setTimeout(function(){
                    image.height(image.width())
                },100)
            } else if ( options.mode == "active") {

            }
        },
        onActive:function(){

        }
    })

    exports.Skill = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                type:"",
                displayName:"",
                level:1,
                maxLevel:5
            }
        },
        levelup:function(){
            this.set("level",this.get("level")+1);
        },
        generateDescription:function(){
            return "";
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
            return "生命值上限加5";
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
            return "升级所需的经验值减少"+(5*this.get("level"))+"%";
        }
    })

    exports.CoolingSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"cooling",
                type:"passive",
                displayName:"沉着",
                level:1,
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
            return "杀死6级或以上怪物时多获得"+(10*this.get("level"))+"%的经验值";
        }
    })

    exports.RecoverSkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"recover",
                type:"passive",
                displayName:"恢复",
                level:1,
                maxLevel:6
            }
        },
        onGet:function(){
            window.hero.set("recover", this.get("level"))
        },
        generateDescription:function(){
            return "回复生命时多回复"+(this.get("level"))+"生命";
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
            return "杀死怪物掉落宝物的概率增加"+(this.get("level")*5)+"%";
        }
    })

    exports.DexteritySkill = exports.Skill.extend({
        defaults:function(){
            return {
                name:"dexterity",
                type:"passive",
                displayName:"敏捷",
                level:1,
                maxLevel:4
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
        exports.ConstitutionSkill,
        exports.CunningSkill,
        exports.DexteritySkill,
        //exports.CoolingSkill,
        exports.WisdomSkill,
        exports.TreasureHuntingSkill,
        exports.RecoverSkill
    ]

    exports.getCommonSkillPool = function(){
        return _.map(exports.commonSkillPoolEntry, genSkill)
    }

    var genSkill = function(entry){
        return {
            viewClass: exports.SkillView,
            model: new entry()
        }
    }
})