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
        }
    })

    exports.RevertSlashUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"revert-slash",
                description:"战士 的 拖刀计技能",
                cost:20
            }
        },
        adjustSkillPool:function(){
            Skill.warriorBasicSkillPoolEntry.push( Skill.RevertSlashSkill )
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
        adjustSkillPool:function(){
            Skill.warriorBasicSkillPoolEntry.push( Skill.BigWhirlSkill )
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
        adjustSkillPool:function(){
            Skill.warriorBasicSkillPoolEntry.push( Skill.HorizontalSlashSkill )
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
        adjustSkillPool:function(){
            Skill.warriorBasicSkillPoolEntry.push( Skill.VerticalSlashSkill )
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
        adjustSkillPool:function(){
            Skill.warriorBasicSkillPoolEntry.push( Skill.CrossSlashSkill )
        }
    })
    exports.WarriorThirdSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"warrior-third-skill",
                description:"战士 的 第3个技能槽",
                cost:50
            }
        },
        adjustHero:function(){
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
                cost:200
            }
        },
        isValid:function(){
            return (new exports.WarriorThirdSkillUnlock()).isUnlocked();
        },
        adjustHero:function(){
            if ( hero.get("type") == "warrior" ){
                hero.set("skillSlot",4)
            }
        }
    })

    exports.PriestUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"priest",
                description:"解锁牧师",
                cost:120
            }
        },
        adjustSkillPool:function(){
            gameStatus.selectableType.push("priest")
        }
    })
    exports.HolyShieldUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"holy-shield",
                description:"牧师 的 圣盔甲技能",
                cost:40
            }
        },
        isValid:function(){
            return (new exports.PriestUnlock()).isUnlocked();
        },
        adjustSkillPool:function(){
            Skill.priestBasicSkillPoolEntry.push( Skill.HolyShieldSkill )
        }
    })
    exports.ConfuseUndeadUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"confuse-undead",
                description:"牧师 的 操控亡灵技能",
                cost:40
            }
        },
        isValid:function(){
            return (new exports.PriestUnlock()).isUnlocked();
        },
        adjustSkillPool:function(){
            Skill.priestBasicSkillPoolEntry.push( Skill.ConfuseUndeadSkill )
        }
    })
    exports.TurnUndeadUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"turn-undead",
                description:"牧师 的 超度亡灵技能",
                cost:100
            }
        },
        isValid:function(){
            return (new exports.PriestUnlock()).isUnlocked();
        },
        adjustSkillPool:function(){
            Skill.priestBasicSkillPoolEntry.push( Skill.TurnUndeadSkill )
        }
    })
    exports.ResurrectionUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"resurrection",
                description:"牧师 的 复活术技能",
                cost:100
            }
        },
        isValid:function(){
            return (new exports.PriestUnlock()).isUnlocked();
        },
        adjustSkillPool:function(){
            Skill.priestBasicSkillPoolEntry.push( Skill.ResurrectionSkill )
        }
    })
    exports.PriestThirdSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"priest-third-skill",
                description:"牧师 的 第3个技能槽",
                cost:100
            }
        },
        isValid:function(){
            return (new exports.PriestUnlock()).isUnlocked();
        },
        adjustHero:function(){
            if ( hero.get("type") == "priest" ){
                if ( hero.get("skillSlot") == 2 )
                    hero.set("skillSlot",3)
            }
        }
    })
    exports.PriestFourthSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"priest-fourth-skill",
                description:"牧师 的 第4个技能槽",
                cost:300
            }
        },
        isValid:function(){
            return (new exports.PriestThirdSkillUnlock()).isUnlocked();
        },
        adjustHero:function(){
            if ( hero.get("type") == "priest" ){
                hero.set("skillSlot",4)
            }
        }
    })

    exports.WizardUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"wizard",
                description:"解锁法师",
                cost:120
            }
        },
        adjustSkillPool:function(){
            gameStatus.selectableType.push("wizard")
        }
    })

    exports.WizardThirdSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"wizard-third-skill",
                description:"法师 的 第3个技能槽",
                cost:100
            }
        },
        isValid:function(){
            return (new exports.WizardUnlock()).isUnlocked();
        },
        adjustHero:function(){
            if ( hero.get("type") == "wizard" ){
                if ( hero.get("skillSlot") == 2 )
                    hero.set("skillSlot",3)
            }
        }
    })
    exports.WizardFourthSkillUnlock = exports.Unlockable.extend({
        defaults:function(){
            return {
                name:"wizard-fourth-skill",
                description:"法师 的 第4个技能槽",
                cost:300
            }
        },
        isValid:function(){
            return (new exports.WizardThirdSkillUnlock()).isUnlocked();
        },
        adjustHero:function(){
            if ( hero.get("type") == "wizard" ){
                hero.set("skillSlot",4)
            }
        }
    })

    exports.AllUnlocks = [
        new exports.RevertSlashUnlock(),
        new exports.BigWhirlUnlock(),
        new exports.HorizontalSlashUnlock(),
        new exports.VerticalSlashUnlock(),
        new exports.CrossSlashUnlock(),
        new exports.WarriorThirdSkillUnlock(),
        new exports.WarriorFourthSkillUnlock(),

        new exports.PriestUnlock(),
        new exports.HolyShieldUnlock(),
        new exports.ConfuseUndeadUnlock(),
        new exports.ResurrectionUnlock(),
        new exports.TurnUndeadUnlock(),
        new exports.PriestThirdSkillUnlock(),
        new exports.PriestFourthSkillUnlock(),

        new exports.WizardUnlock(),
        new exports.WizardThirdSkillUnlock(),
        new exports.WizardFourthSkillUnlock(),
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
            return true;
        },
        isPassed:function(){
            return false;
        },
        isGotten:function(){
            return localStorage.getItem("get-reward-"+this.get("name"));
        },
        getReward:function(){
            var star = localStorage.getItem("player-star");
            if ( star == null )
                star = 0;
            else
                star = parseInt(star);
            localStorage.setItem("player-star", star + this.get("reward"));
            localStorage.setItem("get-reward-"+this.get("name"), true);
        }
    })

    exports.SlimeLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"slime-level",
                displayName:"史莱姆的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级史莱姆",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["slime"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.SlimeCountAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"slime-count",
                displayName:"史莱姆猎手",
                description:"杀死100个史莱姆",
                reward:10
            }
        },
        isPassed:function(){
            return statistic.kill.monsterCount["slime"] >= 100;
        }
    })

    exports.SlimeCount2Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"slime-count2",
                displayName:"史莱姆屠夫",
                description:"杀死1000个史莱姆",
                reward:50
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-slime-count");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["slime"] >= 1000;
        }
    })

    exports.SlimeCount3Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"slime-count3",
                displayName:"史莱姆灭绝者",
                description:"杀死10000个史莱姆",
                reward:200
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-slime-count2");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["slime"] >= 10000;
        }
    })

    exports.SkeletonLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skeleton-level",
                displayName:"骷髅的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级骷髅",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["skeleton"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.SkeletonCountAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skeleton-count",
                displayName:"骷髅猎手",
                description:"杀死100个骷髅",
                reward:10
            }
        },
        isPassed:function(){
            return statistic.kill.monsterCount["skeleton"] >= 100;
        }
    })

    exports.SkeletonCount2Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skeleton-count2",
                displayName:"骷髅屠夫",
                description:"杀死1000个骷髅",
                reward:50
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-skeleton-count");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["skeleton"] >= 1000;
        }
    })

    exports.SkeletonCount3Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skeleton-count3",
                displayName:"骷髅灭绝者",
                description:"杀死10000个骷髅",
                reward:200
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-skeleton-count2");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["skeleton"] >= 10000;
        }
    })

    exports.OrcLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"orc-level",
                displayName:"兽人的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级兽人",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["orc"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.OrcCountAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"orc-count",
                displayName:"兽人猎手",
                description:"杀死100个兽人",
                reward:10
            }
        },
        isPassed:function(){
            return statistic.kill.monsterCount["orc"] >= 100;
        }
    })

    exports.OrcCount2Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"orc-count2",
                displayName:"兽人屠夫",
                description:"杀死1000个兽人",
                reward:50
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-orc-count");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["orc"] >= 1000;
        }
    })

    exports.OrcCount3Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"orc-count3",
                displayName:"兽人灭绝者",
                description:"杀死10000个兽人",
                reward:200
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-orc-count2");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["orc"] >= 10000;
        }
    })

    exports.GoblinLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"goblin-level",
                displayName:"哥布林的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级哥布林",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["goblin"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.GoblinCountAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"goblin-count",
                displayName:"哥布林猎手",
                description:"杀死100个哥布林",
                reward:10
            }
        },
        isPassed:function(){
            return statistic.kill.monsterCount["goblin"] >= 100;
        }
    })

    exports.GoblinCount2Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"goblin-count2",
                displayName:"哥布林屠夫",
                description:"杀死1000个哥布林",
                reward:50
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-goblin-count");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["goblin"] >= 1000;
        }
    })

    exports.GoblinCount3Achievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"goblin-count3",
                displayName:"哥布林灭绝者",
                description:"杀死10000个哥布林",
                reward:200
            }
        },
        isValid:function(){
            return localStorage.getItem("get-reward-goblin-count2");
        },
        isPassed:function(){
            return statistic.kill.monsterCount["goblin"] >= 10000;
        }
    })

    exports.MimicLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"mimic-level",
                displayName:"宝箱怪的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级宝箱怪",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["mimic"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.MedusaLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"medusa-level",
                displayName:"美杜莎的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级美杜莎",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["medusa"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.GhostLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"ghost-level",
                displayName:"幽灵的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级幽灵",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["ghost"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.ArcherLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"archer-level",
                displayName:"骷髅弓箭手的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级骷髅弓箭手",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["archer"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.MinotaurLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"minotaur-level",
                displayName:"牛头怪的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级牛头怪",
                reward:50
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["minotaur"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.OgreLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"ogre-level",
                displayName:"食人魔的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级食人魔",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["ogre"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.ShamanLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"shaman-level",
                displayName:"萨满的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级萨满",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["shaman"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.SnakeLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"snake-level",
                displayName:"毒蛇的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级毒蛇",
                reward:20
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["snake"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.TrollLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"troll-level",
                displayName:"巨魔的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级巨魔",
                reward:30
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["troll"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.VampireLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"vampire-level",
                displayName:"吸血鬼的华丽谢幕",
                description:"杀死一个3<span class='star'></span>级吸血鬼",
                reward:50
            }
        },
        isPassed:function(){
            return statistic.kill.monsterLevel["vampire"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.KillBossAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"kill-a-boss",
                displayName:"漫长的等待",
                description:"杀死1个Boss",
                reward:10
            }
        },
        isPassed:function(){
            return statistic.kill.bossCount > 0;
        }
    })

    exports.KillByPoisonAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                hidden:true,
                name:"killed-by-poison",
                displayName:"病入膏肓",
                description:"毒发身亡",
                reward:40
            }
        },
        isPassed:function(){
            return statistic.killed.byPoison > 0;
        }
    })

    exports.KillByFullAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                hidden:true,
                name:"killed-by-full",
                displayName:"人满为患",
                description:"地城爆满而死",
                reward:30
            }
        },
        isPassed:function(){
            return statistic.killed.byFull > 0;
        }
    })

    exports.KillByBossAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                hidden:true,
                name:"killed-by-boss",
                displayName:"死而无憾",
                description:"被Boss杀死",
                reward:30
            }
        },
        isPassed:function(){
            return statistic.killed.byBoss > 0;
        }
    })

    exports.PotionLevelAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"potion-level",
                displayName:"灵丹妙药",
                description:"获得一个3<span class='star'></span>级回复药",
                reward:10
            }
        },
        isPassed:function(){
            statistic.items.itemLevel = statistic.items.itemLevel || {};
            return statistic.items.itemLevel["potion"] >= 3*WISDOM_THRESHOLD;
        }
    })

    exports.SkillWhirlAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skill-whirl",
                displayName:"大杀四方",
                description:"战士的回旋斩同时杀死4个怪物",
                reward:30
            }
        },
        isPassed:function(){
            return statistic.skills.whirl;
        }
    })

    exports.SkillBigWhirlAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skill-big-whirl",
                displayName:"风卷残云",
                description:"战士的大回旋斩同时杀死8个怪物",
                reward:50
            }
        },
        isValid:function(){
            return (new exports.BigWhirlUnlock()).isUnlocked();
        },
        isPassed:function(){
            return statistic.skills["big-whirl"];
        }
    })

    exports.SkillTurnUndeadAchievement = exports.Achievement.extend({
        defaults:function(){
            return {
                name:"skill-turn-undead",
                displayName:"极乐往生",
                description:"超度亡灵同时消灭至少15个怪物",
                reward:80
            }
        },
        isValid:function(){
            return (new exports.TurnUndeadUnlock()).isUnlocked();
        },
        isPassed:function(){
            return statistic.skills["turn-undead"];
        }
    })

    exports.AllAchievements = [

//        new exports.SlimeCountAchievement(),
//        new exports.SlimeCount2Achievement(),
//        new exports.SlimeCount3Achievement(),

//        new exports.SkeletonCountAchievement(),
//        new exports.SkeletonCount2Achievement(),
//        new exports.SkeletonCount3Achievement(),

//        new exports.OrcCountAchievement(),
//        new exports.OrcCount2Achievement(),
//        new exports.OrcCount3Achievement(),

//        new exports.GoblinCountAchievement(),
//        new exports.GoblinCount2Achievement(),
//        new exports.GoblinCount3Achievement(),
        new exports.ArcherLevelAchievement(),
        new exports.GhostLevelAchievement(),
        new exports.GoblinLevelAchievement(),
        new exports.MedusaLevelAchievement(),
        new exports.MimicLevelAchievement(),
        new exports.MinotaurLevelAchievement(),
        new exports.OgreLevelAchievement(),
        new exports.OrcLevelAchievement(),
        new exports.ShamanLevelAchievement(),
        new exports.SkeletonLevelAchievement(),
        new exports.SlimeLevelAchievement(),
        new exports.SnakeLevelAchievement(),
        new exports.TrollLevelAchievement(),
        new exports.VampireLevelAchievement(),
        new exports.KillBossAchievement(),

        new exports.KillByPoisonAchievement(),
        new exports.KillByFullAchievement(),
        new exports.KillByBossAchievement(),

        new exports.PotionLevelAchievement(),

        new exports.SkillWhirlAchievement(),
        new exports.SkillBigWhirlAchievement(),

        new exports.SkillTurnUndeadAchievement()
    ]
});