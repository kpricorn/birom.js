function BiromClient() {
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;
    var stonePaths = [];
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
                var stone = stonePaths[message.biromId];
                stone.rotation = ((stone.rotation || 0) + 60) % 360;
                console.debug(stone.rotation);
                stone.rotate(stone.rotation, stone.getBBox().x + 50, stone.getBBox().y + 43);
            });
            self.client.subscribe('/move', function(message) {
                var stone = stonePaths[message.biromId];
                var absX = stone.getBBox().x;
                var absY = stone.getBBox().y;

                stone.realX = (stone.realX || absX) + message.x;
                stone.realY = (stone.realY || absY) + message.y;

                console.debug('=====================================================================');
                console.debug('Move ' + stone.biromId + ' to:         ' + message.x + '/' + message.y);
                console.debug('Absolute position: ' + absX + '/' + absY);
                console.debug('real move:         ' + stone.realX + '/' + stone.realY);
                var snapX = Raphael.snapTo(snapXPoints, stone.realX);
                var snapY = Raphael.snapTo(snapYPoints, stone.realY);
                console.debug('Snap to:           ' + snapX + '/' + snapY);
                if (snapX != absX || snapY != absY) {
                    var newX = snapX - absX;
                    var newY = snapY - absY;
                    stone.translate(newX, newY);
                    stone.showBBox();
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
                  biromId: this.biromId
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
            var stone = self.field.path(stonePath);
            stone.hideBBox = function() {
                this.stonePathBBox.remove();
            };
            stone.showBBox = function() {
                if (this.stonePathBBox != undefined) {
                    this.hideBBox();
                }
                this.stonePathBBox = self.field.rect(this.getBBox().x, this.getBBox().y, this.getBBox().width, this.getBBox().height);
                this.stonePathBBox.attr({stroke: "white"});
            };
            stone.hover(function (event) {
                this.showBBox();
            }, function (event) {
                this.hideBBox();
            });

            stone.attr({
                fill: color
                , stroke: color
                , "stroke-width": 2
                , cursor: "move"
                , title: "0/0"
            });
            stone.biromId = i;
            stone.translate(3*50, 3*86);
            stone.drag(move, dragger, up);
            stone.dblclick(function(event) {
                self.client.publish('/rotate', {
                      biromId: this.biromId
                });
            });
            stonePaths.push(stone);
            console.debug(stone);
        }

        var redBirom = self.field.path(stonePath);
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

