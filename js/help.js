define(function(require,exports,module) {
    exports.HelpView = Backbone.View.extend({
        initialize:function(options){
            var self = this;
            this.$el.addClass("help")
            this.$el.html("<div class='help-body'><div class='help-image'></div><div class='help-text'></div></div><label class='close-help'>&gt;&gt;点击继续&lt;&lt;</button>")
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

    exports.monsterDescription = {
        "slime":{
            text:"史莱姆<br/>攻击力：弱（为等级的1/2）<br/>经验值：低",
            imageClass:"slime-help"
        },
        "skeleton":{
            text:"骷髅<br/>攻击力：中（与等级相同）<br/>经验值：中",
            imageClass:"skeleton-help"
        },
        "ogre":{
            text:"食人魔<br/>攻击力：强（为等级的2倍）<br/>经验值：高",
            imageClass:"ogre-help"
        },
        "archer":{
            text:"骷髅弓箭手<br/>远程攻击<br/>攻击力：始终为1<br/>经验值：中",
            imageClass:"archer-help"
        },
        "vampire":{
            text:"吸血鬼<br/>每次击中英雄后升级<br/>攻击力：强（为等级的2倍）<br/>经验值：高",
            imageClass:"vampire-help"
        }
    }
});