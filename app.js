var path = require('path')
  , express = require('express')
  , app = express();

app.set('env', 'development');

app.configure('development', function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
});

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('secret'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src:__dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());

app.get('/', require('./routes/home'));
app.all('/login', require('./routes/login'));
app.all('/registration', require('./routes/registration'));

app.use(function (req, res) {
  throw new Error('404');
});

app.use(function (err, req, res) {
  res.write('Error : ' + err);
  res.end();
});

app.listen(app.get('port'), function () {
  console.log('server started');
});
