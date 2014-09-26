define(function(require,exports,module){
    window.WISDOM_THRESHOLD = 6;

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
               hp : 10,
               maxHp:10,
               attack : 1,
               defend : 0,
               direction: 2,
               position: {
                   x:2,
                   y:2
               },
               constitution:0,
               cunning:0,
               wisdom:0,
               dexterity:0,
               cooling:0,
               recover:0,
               treasureHunting:0
           }
       },
       initialize:function(){
            this.on("change:constitution", this.onConstitutionChange, this);
           this.on("change:cunning", this.onCunningChange, this);
       },
       getExp:function(exp, level){
           var currentExp = this.get("exp");
           var expRequire = this.get("maxExp");
           if ( level >= WISDOM_THRESHOLD ){
                exp += Math.round( exp * this.get("wisdom")*0.1 );
           }
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
           return Math.ceil(lv*10*(1-0.05*this.get("cunning")));
       },
       onConstitutionChange:function(){
           var maxHp = this.calMaxHp(this.get("level"));
           this.set({
               hp: ( this.get("constitution") - this.previous("constitution") ) * 5 + this.get("hp"),
               maxHp: maxHp
           });
       },
       onCunningChange:function(){
           this.set({
               maxExp: this.calExpRequire(this.get("level"))
           });
       },
       calMaxHp:function(lv){
           return lv*10+this.get("constitution")*5;
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
                direction: 2,
                angry: 0
            }
        },
        initialize:function(){
            this.setToLevel(this.get("level"));
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
        },
        onHitHero:function(){

        }
    })

    exports.Slime = exports.Monster.extend({
        calAttack:function(level){
            return Math.round(level/2);
        }
    })

    exports.Goblin = exports.Monster.extend({
        calAttack:function(level){
            return Math.round(level/2);
        }
    })

    exports.Skeleton = exports.Monster.extend({
        calExp:function(level){
            return Math.floor(level*3/2);
        }
    })

    exports.Mimic = exports.Monster.extend({
        calExp:function(level){
            return 1;
        }
    })

    exports.Ogre = exports.Monster.extend({
        calAttack:function(level){
            return level*2;
        },
        calExp:function(level){
            return level*(level-1)+1;
        }
    })

    exports.Orc = exports.Monster.extend({
        calExp:function(level){
            return level*2-1;
        }
    })

    exports.Vampire = exports.Monster.extend({
        calAttack:function(level){
            return level*2;
        },
        calExp:function(level){
            return level*(level-1)+1;
        },
        onHitHero:function(){
            this.setToLevel(this.get("level")+1);
        }
    })

    exports.Archer = exports.Monster.extend({
        calAttack:function(level){
            return 1;
        },
        calExp:function(level){
            return Math.floor(level*3/2);
        }
    })

    exports.ModelMap = {
        archer:exports.Archer,
        goblin:exports.Goblin,
        mimic:exports.Mimic,
        skeleton:exports.Skeleton,
        slime:exports.Slime,
        ogre:exports.Ogre,
        orc:exports.Orc,
        vampire:exports.Vampire
    }

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
                effect : level * (level-1)
            })
        },
        effectHappen:function(){
            if ( this.get("type") == "potion" ) {
                window.heroView.getHp(this.get("effect"));
            }
        }
    })
});