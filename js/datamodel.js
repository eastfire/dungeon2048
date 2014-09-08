define(function(require,exports,module){
   exports.Hero = Backbone.Model.extend({
       UP:0,
       RIGHT:1,
       DOWN:2,
       LEFT:3,

       defaults:function(){
           return {
               race:"human",
               type:"warrior",
               typeDisplayName:"战士",
               level:1,
               exp:0,
               maxExp:10,
               hp : 15,
               maxHp:15,
               attack : 1,
               defend : 0,
               direction: 2,
               position: {
                   x:2,
                   y:2
               }
           }
       },
       initialize:function(){

       },
       getExp:function(exp){
           var currentExp = this.get("exp");
           var expRequire = this.get("maxExp");
           if ( currentExp+exp >= expRequire ) {
               this.levelUp();
               this.getExp(currentExp+exp-expRequire);
           } else {
               this.set("exp", currentExp + exp);
           }
       },
       levelUp:function(){
           var newLevel = this.get("level")+1;
           var newMaxHp = this.calMaxHp(newLevel)
           this.set({
               exp:0,
               level: newLevel,
               maxHp: newMaxHp,
               hp:newMaxHp,
               maxExp:this.calExpRequire(newLevel)
           })
       },
       calExpRequire:function(lv){
           return lv*10;
       },
       calMaxHp:function(lv){
           return lv*5+10;
       }
   })

    exports.Monster = Backbone.Model.extend({
        defaults:function(){
            return {
                type:"slime",
                level:1,
                exp:1,
                attack:1,
                hp:1,
                defend:0,
                position: {
                    x:0,
                    y:0
                },
                direction: 2
            }
        },
        initialize:function(){

        },
        setToLevel:function(level){
            this.set({
                level:level,
                attack:this.calAttack(level),
                exp:this.calExp(level)
            })
        },
        calAttack:function(level){
            return level;
        },
        calExp:function(level){
            return level;
        }
    })

    exports.Item = Backbone.Model.extend({
        defaults: function () {
            return {
                type: "potion",
                level: 1,
                effect: 1,
                position: {
                    x: 0,
                    y: 0
                },
                direction: 2
            }
        },
        initialize: function () {

        },
        setToLevel: function (level) {
            this.set({
                level: level,
                effect : level * 2 + 1
            })
        },
        effectHappen:function(){
            if ( this.get("type") == "potion" ) {
                window.heroView.getHp(this.get("effect"));
            }
        }
    })
});