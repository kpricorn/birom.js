function BiromClient() {
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;
    var stones = [];
    var snapXPoints = [];
    var snapYPoints = [];
    for (var i = 0; i < 900 / 50; i++) {
        snapXPoints.push(i * 50);
        snapXPoints.push(i * 50 + 25);
    };
    for (var i = 0; i < 500 / 86; i++) {
        snapYPoints.push(i * 86);
        snapYPoints.push(i * 86 + 43);
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
                var stonePath = stones[message.id];
                stonePath.rotation = ((stonePath.rotation || 0) + 60) % 360;
                console.debug(stonePath.rotation);
                stonePath.rotate(stonePath.rotation, stonePath.getBBox().x + 50, stonePath.getBBox().y + 43);
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
                var snapX = Raphael.snapTo(snapXPoints, stonePath.realX);
                var snapY = Raphael.snapTo(snapYPoints, stonePath.realY);
                console.debug('Snap to:           ' + snapX + '/' + snapY);
                if (snapX != absX || snapY != absY) {
                    var newX = snapX - absX;
                    var newY = snapY - absY;
                    stonePath.translate(newX, newY);
                    stonePath.showBBox();
                }
            });
        });
    };

    this.viewDidResize = function () {
        console.debug("resize windows (" + $('body').width() + "/" + $(window).height() + ")");
        var width = $('body').width(),
                height = $(window).height();

        self.field.setSize(width, height);
        self.setupGrid();
    }

    this.setupGrid = function() {
        console.debug('setup grid');
        if (self.grid != undefined) {
            self.grid.remove();
        }
        self.grid = self.field.set();
        for (var x = 0; x < self.field.width / 50; x++) {
            for (var y = 0; y < self.field.height / 86; y++) {
                var tile = self.field.path(gridTile);
                tile.translate(x*50, y*86);
                self.grid.push(tile);
            };
        };
        self.grid.toBack();
        self.grid.attr({
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
            this.attr({title: this.getBBox().x + " / " + this.getBBox().y});
        };

        // Create Field
        self.field = Raphael("field", "100%", "100%");

        for (var i = 0; i < 10; i++) {
            var color = i%2 == 0 ? '#bfac00' : '#004cbf';
            var stonePath = self.field.path(stone);
            stonePath.hideBBox = function() {
                this.stoneBBox.remove();
            };
            stonePath.showBBox = function() {
                if (this.stoneBBox != undefined) {
                    this.hideBBox();
                }
                this.stoneBBox = self.field.rect(this.getBBox().x, this.getBBox().y, this.getBBox().width, this.getBBox().height);
                this.stoneBBox.attr({stroke: "white"});
            };
            stonePath.hover(function (event) {
                this.showBBox();
            }, function (event) {
                this.hideBBox();
            });
            
            stonePath.attr({
                fill: color
                , stroke: color
                , "stroke-width": 2
                , cursor: "move"
                , title: "0/0"
            });
            stonePath.drag(move, dragger, up);
            stonePath.dblclick(function(event) {
                self.client.publish('/rotate', {
                      id: this.id
                });
            });
            stones.push(stonePath);
        }

        var redBirom = self.field.path(stone);
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
    $(window).resize(function() {
        biromClient.viewDidResize();
    });
});

