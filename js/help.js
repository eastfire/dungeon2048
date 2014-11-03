define(function(require,exports,module) {
    exports.HelpView = Backbone.View.extend({
        initialize:function(options){
            var self = this;
            this.$el.addClass("help")
            this.$el.html("<div class='help-body'><div class='help-image'></div><div class='help-text'></div></div><label class='close-help'>&gt;&gt;点击（任意键）继续&lt;&lt;</button>")
            this.helpImage = this.$(".help-image")
            setTimeout(function(){
                self.helpImage.css({height: self.helpImage.width()});
            },100);
            this.helpText = this.$(".help-text")
            this.helpText.html(options.text);
            if ( options.imageClass ){
                this.helpImage.addClass(options.imageClass)
            }

            this.$el.on("click",function(){
                self.remove();
                window.showingDialog = false;
            })
        },
        render:function(){
            return this;
        },
        show:function(){
            window.showingDialog = true;
            $(".main-window").append(this.render().$el);
        }
    });

    exports.heroTypeDisplayName = {
        priest:"牧师",
        warrior:"战士",
        wizard:"法师",
        thief:"盗贼"
    }

    exports.heroRaceDisplayName = {
        human:"人类",
        "half-orc":"半兽人",
        "elf":"精灵",
        "dwarf":"矮人"
    }

    exports.heroRaceDescription = {
        human:"每个能升级的技能的上限加1<br/>升级时可以３选１",
        "half-orc":"初始生命30<br/>每次升级或体质升级时最大生命值加15",
        "elf":"生命小于20%时，技能冷却每回合减2<br/>生命小于10%时，技能冷却每回合减3",
        "dwarf":"每回合恢复1生命，可升级"
    }

    exports.monsterDisplayName = {
        "archer":"骷髅弓箭手",
        "gargoyle":"石像鬼",
        "ghost":"幽灵",
        "goblin":"哥布林",
        "golem":"魔像",
        "kobold":"狗头人",
        "medusa":"美杜莎",
        "mimic":"宝箱怪",
        "minotaur":"牛头怪",
        "mummy":"木乃伊",
        "ogre":"食人魔",
        "orc":"兽人",
        "rat-man":"鼠人",
        "shaman":"萨满",
        "skeleton":"骷髅",
        "slime":"史莱姆",
        "snake":"毒蛇",
        "troll":"巨魔",
        "vampire":"吸血鬼",

        "boss-beholder":"Boss眼魔",
        "boss-death":"Boss死神",
        "boss-hydra":"Boss九头蛇",
        "boss-lich":"Boss巫妖"
    }
    exports.monsterDescription = {
        "archer":{
            text:"远程攻击（射程3）<br/>攻击力：很低（等级的1/4）<br/>经验值：中",
            imageClass:"archer-help"
        },
        "gargoyle":{
            text:"击中英雄后一定概率使英雄<u><i>封魔</i></u>（无法使用技能）直到下回合<br/>等级越高概率越高<br/>攻击力：中<br/>经验值：中偏高",
            imageClass:"gargoyle-help"
        },
        "ghost":{
            text:"一定概率躲过英雄的普通攻击<br/>等级越高概率越高<br/>攻击力：低（为等级的1/2）<br/>经验值：中偏高",
            imageClass:"ghost-help"
        },
        "goblin":{
            text:"每次合并后升级<br/>攻击力：低（为等级的1/2）<br/>经验值：低",
            imageClass:"goblin-help"
        },
        "golem":{
            text:"对英雄的技能攻击免疫<br/>攻击力：非常强（为等级的平方）<br/>经验值：非常高",
            imageClass:"golem-help"
        },
        "kobold":{
            text:"击中英雄后一定概率<u><i>干扰</i></u>英雄（技能冷却时间加1）<br/>等级越高概率越高<br/>攻击力：低（为等级的1/2）<br/>经验值：中",
            imageClass:"kobold-help"
        },
        "medusa":{
            text:"击中英雄后一定概率使英雄<u><i>麻痹</i></u>（无法移动）直到下回合。<br/>等级越高概率越高<br/>攻击力：中（与等级相同）<br/>经验值：高",
            imageClass:"medusa-help"
        },
        "mimic":{
            text:"必然掉落宝物，宝物等级为怪物等级1/3<br/>攻击力：中（与等级相同）<br/>经验值：始终为1",
            imageClass:"mimic-help"
        },
        "minotaur":{
            text:"攻击力：非常强（为等级的平方）<br/>经验值：非常高",
            imageClass:"minotaur-help"
        },
        "mummy":{
            text:"击中英雄后一定概率使英雄<i><u>被诅咒</u></i>（不良状态持续时间加倍，中毒效果加倍，升级后解除）<br/>攻击力：非常中（与等级相同）<br/>经验值：中",
            imageClass:"mummy-help"
        },
        "ogre":{
            text:"攻击力：强（为等级的2倍）<br/>经验值：高",
            imageClass:"ogre-help"
        },
        "orc":{
            text:"出现或合并后<i><u>愤怒</u></i>(攻击力3倍)直到下回合<br/>攻击力：中（与等级相同）<br/>经验值：中",
            imageClass:"orc-help"
        },
        "rat-man":{
            text:"合并后随机偷走其上下左右的1个宝物并升级<br/>攻击力：弱（为等级的1/2）<br/>经验值：中偏高",
            imageClass:"rat-man-help"
        },
        "shaman":{
            text:"出现或合并后使周围怪物<i><u>愤怒</u></i>(攻击力3倍)直到下回合<br/>攻击力：弱（为等级的1/2）<br/>经验值：中",
            imageClass:"shaman-help"
        },
        "skeleton":{
            text:"攻击力：中（与等级相同）<br/>经验值：中",
            imageClass:"skeleton-help"
        },
        "slime":{
            text:"攻击力：弱（为等级的1/2）<br/>经验值：低",
            imageClass:"slime-help"
        },
        "snake":{
            text:"击中英雄后使英雄<i><u>中毒</u></i>(每回合开始-1HP，升级或获得回复药时解毒)<br/>攻击力：弱（为等级的1/2）<br/>经验值：中",
            imageClass:"snake-help"
        },
        "troll":{
            text:"远程攻击（射程3）<br/>击中英雄后一定概率使英雄<u><i>晕眩</i></u>(上下左右操作相反)1回合<br/>攻击力：中（与等级相同）<br/>经验值：高",
            imageClass:"troll-help"
        },
        "vampire":{
            text:"击中英雄后升级<br/>攻击力：非常强（为等级的平方）<br/>经验值：非常高",
            imageClass:"vampire-help"
        },

        //boss help
        "boss-beholder":{
            text:"所有怪物击中英雄后一定概率使英雄<u><i>麻痹</i></u>、<u><i>晕眩</i></u><br/>、<u><i>封魔</i></u>、<u><i>干扰</i></u><br/>攻击力：英雄最大生命值的1/3<br/>经验值：超高",
            imageClass:"boss-beholder-help"
        },
        "boss-death":{
            text:"攻击力：英雄最大生命值的2/3<br/>经验值：超高",
            imageClass:"boss-death-help"
        },
        "boss-hydra":{
            text:"所有其他怪物攻击力加倍<br/>攻击力：英雄最大生命值的1/2<br/>经验值：超高",
            imageClass:"boss-hydra-help"
        },
        "boss-lich":{
            text:"远程攻击（射程无限）<br/>攻击力：英雄最大生命值的1/8<br/>经验值：超高",
            imageClass:"boss-lich-help"
        }
    }
});