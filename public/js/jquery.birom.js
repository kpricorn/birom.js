function BiromClient() {
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;
    var stones;
    var field;

    this.init = function() {
        self.setupBayeuxHandlers();
        self.setupField();
    };

    this.setupBayeuxHandlers = function() {
        $.getJSON("/config.json", function(config) {
            self.client = new Faye.Client("http://" + window.location.hostname + ':' + config.port + '/faye', {
                timeout: 120
            });

            self.client.subscribe('/move', function(message) {
                var stone = stones[message.id];
                //console.debug('move stone: ' + stone.id + ' to ' + message.x + '/' + message.y);
                stone.translate(message.x, message.y);

            });
        });
    };

    this.setupField = function() {
        console.debug('setup playing field');
        var dragger = function() {
            console.debug("dnd start");
        };
        var move = function(dx, dy) {
            var tx = dx - this.odx || 0,
            ty = dy - this.ody || 0;
            self.client.publish('/move', {
                  id: this.id
                , x: tx
                , y: ty
            });
            this.odx = dx;
            this.ody = dy;
        };
        var up = function() {
            console.debug("dnd done");
            this.odx = undefined;
            this.ody = undefined;
        };

        // Create Field
        field = Raphael("field", 900, 500);
        stones = [
            field.path(stone)
            , field.path(stone)
            , field.path(stone)
            , field.path(stone)
            ];
        for (var i = 0, ii = stones.length; i < ii; i++) {
            var color = Raphael.getColor();
            stones[i].attr({
                id: i,
                fill: color,
                stroke: color,
                "stroke-width": 2,
                cursor: "move"
            });
            stones[i].drag(move, dragger, up);
            stones[i].dblclick(function(event) {
                this.rotate(60);
            });
        }
    };

    this.init();
};

var biromClient;
jQuery(function() {
    biromClient = new BiromClient();
});

