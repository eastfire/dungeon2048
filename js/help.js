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
                window.gameStatus.showingDialog = false;
            })
        },
        render:function(){
            return this;
        },
        show:function(){
            gameStatus.showingDialog = true;
            $(".main-window").append(this.render().$el);
        }
    });

    exports.monsterDisplayName = {
        "archer":"骷髅弓箭手",
        "goblin":"哥布林",
        "mimic":"宝箱怪",
        "minotaur":"牛头怪",
        "ogre":"食人魔",
        "orc":"兽人",
        "shaman":"萨满",
        "skeleton":"骷髅",
        "slime":"史莱姆",
        "snake":"毒蛇",
        "vampire":"吸血鬼"
    }
    exports.monsterDescription = {
        "archer":{
            text:"远程攻击<br/>攻击力：始终为1<br/>经验值：中",
            imageClass:"archer-help"
        },
        "goblin":{
            text:"每次合并后升级<br/>攻击力：低（为等级的1/2）<br/>经验值：低",
            imageClass:"goblin-help"
        },
        "mimic":{
            text:"必然掉落宝物，且其等级与怪物等级相同<br/>攻击力：中（与等级相同）<br/>经验值：始终为1",
            imageClass:"mimic-help"
        },
        "minotaur":{
            text:"攻击力：非常强（为等级的平方）<br/>经验值：非常高",
            imageClass:"minotaur-help"
        },
        "ogre":{
            text:"攻击力：强（为等级的2倍）<br/>经验值：高",
            imageClass:"ogre-help"
        },
        "orc":{
            text:"出现或合并后<i><u>愤怒</u></i>(攻击力3倍)直到下回合<br/>攻击力：中（与等级相同）<br/>经验值：中",
            imageClass:"orc-help"
        },
        "shaman":{
            text:"出现或合并后使周围怪物进入<i><u>愤怒</u></i>(攻击力3倍)直到下回合<br/>攻击力：弱（为等级的1/2）<br/>经验值：中",
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
        "vampire":{
            text:"击中英雄后升级<br/>攻击力：非常强（为等级的平方）<br/>经验值：非常高",
            imageClass:"vampire-help"
        }
    }
});