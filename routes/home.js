var async = require('async')
  , request = require('request')
  , db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken;

function requestToken(googleAccountToken, code, callback) {
  var google_token_url = 'https://accounts.google.com/o/oauth2/token';
  request.post(google_token_url, {form:{
    'code':code,
    'client_id':googleAccountToken.client_id,
    'client_secret':googleAccountToken.client_secret,
    'redirect_uri':'http://localhost:3000',
    'grant_type':'authorization_code'
  }}, function (error, response, body) {
    console.log('body :', body);
    var now, result = JSON.parse(body);
    if (error) {
      return callback(error);
    }
    now = new Date().getTime();
    console.log('result.access_token :', result.access_token);
    googleAccountToken.access_token = result.access_token;
    googleAccountToken.expires_at = new Date(now + result.expires_in);
    googleAccountToken.refresh_token = result.refresh_token;
    googleAccountToken.save(function (err) {
      return callback(err);
    });
  });
}

var middleware = function (req, res, next) {
  if (req.query.code === undefined || req.session.username === undefined) {
    res.render('home');
  } else {
    var username = req.session.username, currentUrl = req.url;
    GoogleAccountToken.findOne({username:username}, function (err, googleAccountToken) {
      if (err) {
        return res.send(500, err);
      }
      if (googleAccountToken === null) {
        return res.redirect('/registration?next=' + currentUrl);
      }
      requestToken(googleAccountToken, req.query.code, function (err) {
        delete req.session.username;
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  }
};

module.exports = middleware;