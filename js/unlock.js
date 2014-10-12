define(function(require,exports,module){
    exports.Unlockable = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                displayName:"",
                cost:0
            }
        },
        checkValid:function(){

        },
        onUnlock:function(){

        }
    })

    exports.Achievement = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                displayName:"",
                reward:0
            }
        },
        checkValid:function(){

        },
        checkPass:function(){

        },
        onReward:function(){

        }
    })
});