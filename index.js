const api = require('./api.js');
const dbHost = 'mongodb://localhost:27017/headbook';
const app = api(dbHost);
const express = api.express
    // redirect root
app.use('/', express.static(__dirname + '/site'));
// redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
// redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
// redirect CSS bootstrap
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

var listener = app.listen(process.env.PORT || 3000, function() {
    console.log('Example app listening on port ' + listener.address().port);
});