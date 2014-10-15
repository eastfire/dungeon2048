define(function(require,exports,module){
    var Skill = require("./skill")

    exports.Unlockable = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                description:"",
                cost:0
            }
        },
        isValid:function(){
            return true;
        },
        effect:function(){

        },
        isUnlocked:function(){
            return localStorage.getItem("unlock-"+this.get("name"));
        },
        unlock:function(){
            localStorage.setItem("unlock-"+this.get("name"), true);
        },
        onStartGame:function(){
            if ( this.isUnlocked() ) {
                this.effect();
            }
        }
    })

    exports.BigWhirlUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"big-whirl",
                description:"战士 的 大回旋斩技能",
                cost:20
            }
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                gameStatus.skillPool.push(new Skill.BigWhirlSkill())
            }
        }
    })
    exports.HorizontalSlashUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"horizontal-slash",
                description:"战士 的 横斩技能",
                cost:15
            }
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                gameStatus.skillPool.push(new Skill.HorizontalSlashSkill())
            }
        }
    })
    exports.VerticalSlashUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"vertical-slash",
                description:"战士 的 纵斩技能",
                cost:15
            }
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                gameStatus.skillPool.push(new Skill.VerticalSlashSkill())
            }
        }
    })
    exports.CrossSlashUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"cross-slash",
                description:"战士 的 十字斩技能",
                cost:30
            }
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                gameStatus.skillPool.push(Skill.CrossSlashSkill)
            }
        }
    })
    exports.WarriorThirdSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"warrior-third-skill",
                description:"战士 的 第3个技能槽",
                cost:40
            }
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                if ( hero.get("skillSlot") == 2 )
                    hero.set("skillSlot",3)
            }
        }
    })
    exports.WarriorFourthSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"warrior-fourth-skill",
                description:"战士 的 第4个技能槽",
                cost:100
            }
        },
        isValid:function(){
            return (new exports.WarriorThirdSkillUnlock()).isUnlocked();
        },
        effect:function(){
            if ( hero.get("type") == "warrior" ){
                hero.set("skillSlot",4)
            }
        }
    })

    exports.AllUnlocks = [
        new exports.BigWhirlUnlock(),
        new exports.HorizontalSlashUnlock(),
        new exports.VerticalSlashUnlock(),
        new exports.CrossSlashUnlock(),
        new exports.WarriorThirdSkillUnlock(),
        new exports.WarriorFourthSkillUnlock()
    ]

    exports.Achievement = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                displayName:"",
                description:"",
                reward:0
            }
        },
        isValid:function(){

        },
        pass:function(){
            localStorage.setItem("achievement-"+this.get("name"), true);
        },
        isPassed:function(){
            return localStorage.getItem("achievement-"+this.get("name"));
        },
        onReward:function(){

        }
    })
});