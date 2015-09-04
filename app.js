var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
//var methodOverride = require('method-override');
//var errorHandler = require('error-handler');

var routes = require('./routes/index');

var app = express();

// all environments
//app.set('port', process.env.PORT || 4539);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(methodOverride);
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);
//app.use('/map', routes.map);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// development only
//if ('development' == app.get('env')) {
  //app.use(errorHandler);
//}

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
