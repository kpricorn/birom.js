process.addListener('uncaughtException', function (err, stack) {
  console.log('------------------------');
  console.log('Exception: ' + err);
  console.log(err.stack);
  console.log('------------------------');
});

var http = require('http'),
    sys  = require('sys'),
    static = require('node-static'),
    faye = require('faye'),
    url = require('url'),
    express = require('express'),
    connect = require('connect');

var app = express.createServer();


  //self.bayeux = self.createBayeuxServer();

app.configure( function(){

    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());

    //Cookies are not really needed... but may be in the future?
    app.use(express.cookieParser());
    app.use(
        express.session({
            key: "birom-cookie",
            secret: "aoeuaoeuaoeu",
            cookie: { path: '/', httpOnly: true, maxAge: 14400000 }
        })
    );      
});

app.get('/config.json', function(req, res) {
  res.contentType('application/x-javascript');
  res.send({port: 8080});
});

//self.bayeux.attach(app);
app.listen(8000);
sys.log('Server started on PORT ' + 8000);

//Birom.prototype.createBayeuxServer = function() {
//  var self = this;
//  
//  var bayeux = new faye.NodeAdapter({
//    mount: '/faye',
//    timeout: 45
//  });
//  
//  return bayeux;
//};

