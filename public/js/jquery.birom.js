function BiromClient() {
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;
    var stones = [];
    var field;
    var snapXPoints = [];
    var snapYPoints = [];
    for (var i = 0; i < 900 / 50; i++) {
        snapXPoints.push(i * 50);
    };
    for (var i = 0; i < 500 / 86; i++) {
        snapYPoints.push(i * 86);
    };
    console.debug(snapXPoints);
    console.debug(snapYPoints);

    this.init = function() {
        self.setupBayeuxHandlers();
        self.setupField();
        self.setupGrid();
    };

    this.setupBayeuxHandlers = function() {
        $.getJSON("/config.json", function(config) {
            self.client = new Faye.Client("http://" + window.location.hostname + ':' + config.port + '/faye', {
                timeout: 120
            });

            self.client.subscribe('/rotate', function(message) {
                var stone = stones[message.id];
                stone.rotate(60);
            });
            self.client.subscribe('/move', function(message) {
                var stonePath = stones[message.id];
                var absX = stonePath.getBBox().x;
                var absY = stonePath.getBBox().y;

                stonePath.realX = (stonePath.realX || absX) + message.x;
                stonePath.realY = (stonePath.realY || absY) + message.y;

                console.debug('=====================================================================');
                console.debug('Move ' + stonePath.id + ' to:         ' + message.x + '/' + message.y);
                console.debug('Absolute position: ' + absX + '/' + absY);
                console.debug('real move:         ' + stonePath.realX + '/' + stonePath.realY);
                var snapX = Raphael.snapTo(snapXPoints, stonePath.realX, 50);
                var snapY = Raphael.snapTo(snapYPoints, stonePath.realY, 50);
                console.debug('Snap to:           ' + snapX + '/' + snapY);
                if (snapX != absX || snapY != absY) {
                    stonePath.translate(snapX - absX, snapY - absY);
                }
            });
        });
    };

    this.setupGrid = function() {
        var grid = field.set();
        for (var x = 0; x < 900 / 50; x++) {
            for (var y = 0; y < 500 / 86; y++) {
                var tile = field.path(gridTile);
                tile.translate(x*50, y*86);
                grid.push(tile);
            };
        };
        grid.toBack();
        grid.attr({
            "stroke-width": 0.5
            , stroke: "white"
        });
    };

    this.setupField = function() {
        console.debug('setup playing field');
        var dragger = function() {
            console.debug("dnd start");
        };
        var move = function(dx, dy) {
            var tx = dx - this.odx || 0;
            var ty = dy - this.ody || 0;
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
            this.realX = undefined;
            this.realY = undefined;
        };

        // Create Field
        field = Raphael("field", 900, 500);

        for (var i = 0; i < 10; i++) {
            var color = i%2 == 0 ? '#bfac00' : '#004cbf';
            var stonePath = field.path(stone);
            stonePath.attr({
                fill: color,
                stroke: color,
                "stroke-width": 2,
                cursor: "move"
            });
            stonePath.drag(move, dragger, up);
            stonePath.dblclick(function(event) {
                self.client.publish('/rotate', {
                      id: this.id
                });
            });
            stones.push(stonePath);
        }

        var redBirom = field.path(stone);
        redBirom.attr({
            fill: '#bf0000'
            , stroke: '#bf0000'
            ,"stroke-width": 2
        });
        redBirom.translate(9*50, 3*86);
    };

    this.init();
};

var biromClient;
jQuery(function() {
    biromClient = new BiromClient();
});

