require.paths.unshift(__dirname + "/vendor");

process.addListener('uncaughtException', function (err, stack) {
  console.log('------------------------');
  console.log('Exception: ' + err);
  console.log(err.stack);
  console.log('------------------------');
});

var Birom = require('./lib/birom');

new Birom({
  port: 8000
});
