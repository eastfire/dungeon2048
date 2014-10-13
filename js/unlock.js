define(function(require,exports,module){
    exports.Unlockable = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                displayName:"",
                description:"",
                cost:0
            }
        },
        isValid:function(){

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

    exports.Achievement = Backbone.Model.extend({
        defaults:function(){
            return {
                name:"",
                displayName:"",
                reward:0
            }
        },
        isValid:function(){

        },
        isPassed:function(){

        },
        onReward:function(){

        }
    })
});