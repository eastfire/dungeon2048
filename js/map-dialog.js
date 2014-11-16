define(function(require,exports,module) {
    exports.MapDialog = Backbone.View.extend({
        initialize:function(){
            var self = this;
            this.$el.addClass('map-dialog');
            this.$el.on("click",function(){
                self.remove();
                window.showingDialog = false;
            })
            this.$el.html("<div class='map-dialog-wrapper'></div>")
            this.wrapper = this.$(".map-dialog-wrapper");
            this.offsetX = window.roomWidth/2;
            this.offsetY = window.roomHeight/2;
            this.zoomRate = 20;
            this.renderWrapper();
            window.showingDialog = true;
        },
        render:function(){
            return this;
        },
        renderWrapper:function(){
            this.wrapper.css({
                transform:"translate("+this.offsetX+"px,"+this.offsetY+"px)"
            })
        },
        renderExit:function(roomEl, direction, length){
            var el = $("<div class='room-exit-in-map d"+direction+"'></div>");
            roomEl.append(el);
            if ( direction == 1 ){
                el.css({
                    height:this.zoomRate/3,
                    width: length+1,
                    right: -length-1,
                    top:this.zoomRate/3-length-1
                })
            } else if ( direction == 3 ) {
                el.css({
                    height:this.zoomRate/3,
                    width: length+1,
                    left: -length-1,
                    top:this.zoomRate/3-length-1
                })
            } else if ( direction == 0 ){
                el.css({
                    width:this.zoomRate/3,
                    height: length+1,
                    top:-length-1,
                    left:this.zoomRate/3-length-1
                })
            } else {
                el.css({
                    width:this.zoomRate/3,
                    height: length+1,
                    bottom:-length-1,
                    left:this.zoomRate/3-length-1
                })
            }
        },
        renderDialog:function(){
            this.wrapper.empty();

            _.each( window.rooms , function(room){
                var status = room.get("status");
                if ( status == "unknown" )
                    return;

                var el = $("<div class='map-room'></div>")
                el.addClass("size"+room.get("size")).addClass(room.get("status"))
                if ( window.room == room ) {
                    el.addClass("current");
                }
                var sizeAdjust = (7-room.get("size"))*1
                el.css({
                    position:"absolute",
                    width: this.zoomRate - sizeAdjust*2,
                    height: this.zoomRate - sizeAdjust*2,
                    left:room.get("x")*this.zoomRate+sizeAdjust,
                    top:room.get("y")*this.zoomRate+sizeAdjust
                })

                if ( status == "passed" ) {
                    _.each([0,1,2,3],function(d){
                        if ( room.get("winExit"+d) ) {
                            this.renderExit(el,d,sizeAdjust);
                        }
                    },this);
                } else {
                    _.each([0,1,2,3],function(d){
                        if ( room.get("normalExit"+d) ) {
                            this.renderExit(el,d,sizeAdjust);
                        }
                    },this);
                }
                this.wrapper.append(el)
            },this)
        }
    })
});