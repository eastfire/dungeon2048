define(function(require,exports,module) {
    exports.Room = Backbone.Model.extend({
        defaults:function(){
            return {
                size: "5x5", //4x4.6x6.7x6
                hideWinCondition:false,
                winCondition:"survive", //survive, kill, death, levelup
                loseCondition:"death",//death, timeout, kill
                room:null,
                heroAppear:{
                    x:2,
                    y:2
                },
                monsterWave:"",
                monsterTypes:"",
                turnLimit:"",//none, 4 ,etc
                specialCondition:null, // noExp, noHp, noItem
                reward:null,
                onNegativeAction : null
            }
        }
    })
    exports.RoomView = Backbone.View.extend({
        initialize: function (options) {

        }
    });
});