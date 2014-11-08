define(function(require,exports,module) {
    var Skill = require("./skill")

    exports.Race = Backbone.Model.extend({
        adjustSkillPool:function(){

        },
        adjustHero:function(){

        },
        adjustSkillDuration:function(skill){

        },
        adjustSkillCount:function(skill){

        },
        onNewTurn:function(){

        }
    })
    exports.HumanRace = exports.Race.extend({
        adjustSkillPool:function(){
            _.each(window.gameModeStatus.skillPool,function(skill){
                if ( skill.get("maxLevel") > 1 ) {
                    skill.set("maxLevel",skill.get("maxLevel")+1)
                }
            })
        },
        adjustHero:function(){
            hero.set("selectableSkillNumber",3);
        }
    });

    exports.HalfOrcRace = exports.Race.extend({
        adjustSkillPool:function(){
        },
        adjustHero:function(){
            hero.set({
                baseHp:15,
                hp:30,
                maxHp:30});
            window.CONSTITUTION_EFFECT = 15;
            window.LEVELUP_HP_EFFECT = 15;
        }
    });

    exports.ElfRace = exports.Race.extend({
        adjustSkillCount:function(skill){
            if ( hero.get("hp") < hero.get("maxHp") / 2 ) {
                skill.set("currentCount", skill.get("currentCount")+1)
            }
            if ( hero.get("hp") < hero.get("maxHp") / 5 ) {
                skill.set("currentCount", skill.get("currentCount")+1)
            }
        }
    });

    exports.DwarfRace = exports.Race.extend({
        adjustSkillPool:function(){
            var s = new Skill.RegenerationSkill()
            s.set("level",2)
            s.modelClass =  Skill.RegenerationSkill;
            window.gameModeStatus.skillPool.push(s)
        },
        adjustHero:function(){
            hero.set({
                regeneration:1
            });
        }
    });

    exports.allRaces = {
        "human":new exports.HumanRace(),
        "half-orc":new exports.HalfOrcRace(),
        "elf":new exports.ElfRace(),
        "dwarf":new exports.DwarfRace()
    }
});