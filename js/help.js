define(function(require,exports,module) {
    exports.HelpView = Backbone.View.extend({
        initialize:function(options){
            this.$el.addClass("help")
            this.$el.html("<div class='help-body'><div class='help-image'></div><div class='help-text'></div></div><label class='close-help'>&gt;&gt;点击继续&lt;&lt;</button>")
            this.helpImage = this.$(".help-image")
            this.helpImage.css({
                width:blockSize.width,
                height:blockSize.height
            })
            this.helpText = this.$(".help-text")
            this.helpText.html(options.text);
            if ( options.imageClass ){
                this.helpImage.addClass(options.imageClass)
            }
            var self = this;
            this.$el.on("click",function(){
                self.remove();
                window.gameStatus.showingTutorial = false;
            })
        },
        render:function(){
            return this;
        },
        show:function(){
            gameStatus.showingTutorial = true;
            $(".main-window").append(this.render().$el);
        }
    });
});