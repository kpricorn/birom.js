var http = require('http'),
    sys  = require('sys'),
    static = require('node-static/lib/node-static'),
    faye = require('Faye 0.5.2/faye-node'),
    url = require('url');

function Birom(options) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }

  var self = this;
  
  self.settings = {
    port: options.port,
  };

  self.init();
};

Birom.prototype.init = function() {
  var self = this;

  self.bayeux = self.createBayeuxServer();
  self.httpServer = self.createHTTPServer();

  self.bayeux.attach(self.httpServer);
  self.httpServer.listen(self.settings.port);
  sys.log('Server started on PORT ' + self.settings.port);
};

Birom.prototype.createBayeuxServer = function() {
  var self = this;
  
  var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
  });
  
  return bayeux;
};

Birom.prototype.createHTTPServer = function() {
  var self = this;
  
  var server = http.createServer(function(request, response) {
    var file = new static.Server('./public', {
      cache: false
    });

    request.addListener('end', function() {
      var location = url.parse(request.url, true),
          params = (location.query || request.headers);
      
      if (location.pathname == '/config.json' && request.method == "GET") {
        response.writeHead(200, {
          'Content-Type': 'application/x-javascript'
        });
        var jsonString = JSON.stringify({
          port: self.settings.port
        });
        response.end(jsonString);
      } else {
        file.serve(request, response);
      }
    });
  });

  return server;
};

module.exports = Birom;

