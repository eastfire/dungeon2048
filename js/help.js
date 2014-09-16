define(function(require,exports,module) {
    exports.HelpView = Backbone.View.extend({
        initialize:function(options){
            this.$el.addClass("help")
            this.$el.html("<div class='help-body'><div class='help-image'></div><div class='help-text'></div></div><label class='close-help'>&gt;&gt;点击继续&lt;&lt;</button>")
            this.helpImage = this.$(".help-image")
            this.helpText = this.$(".help-text")
            this.helpText.html(options.text);
            var self = this;
            this.$el.on("click",function(){
                self.remove();
            })
        },
        render:function(){
            return this;
        }
    });
});