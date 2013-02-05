var path = require('path')
  , db = require('./lib/db')
  , express = require('express')
  , config = require('./config')
  , app = express();

db.connect();

function exposeTemplateSession(req, res, next) {
  res.locals.currentUrl = req.url;
  res.locals.session = req.session;
  next();
}

function exposeTemplateMessage(req, res, next) {
  if (req.session.message) {
    res.locals.message = req.session.message;
    delete req.session.message;
  }
  next();
}

app.set('env', 'development');

app.configure('development', function () {
  app.set('port', process.env.PORT || config.port);
  app.set('views', path.join(__dirname, 'views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
});

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('secret'));
app.use(express.session());
app.use(exposeTemplateSession);
app.use(exposeTemplateMessage);
app.use(app.router);
app.use(require('less-middleware')({
  src:path.join(__dirname, 'less'),
  dest:path.join(__dirname, 'public', 'css'),
  prefix: '/css',
  compress: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());

config.routes.forEach(function (route) {
  app[route.method || 'all'](route.url, require('./routes/' + route.middleware));
});

app.use(function (req, res) {
  res.send(404, 'Resource ' + req.url + ' not found');
  throw new Error(404);
});

app.use(function (err, req, res) {
  console.error('err :', err);
  res.write('Error : ' + err);
  res.end();
});

app.listen(app.get('port'), function () {
  console.log('server started');
});
