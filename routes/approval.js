var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , request = require('request')
  , middleware;

function requestToken(googleAccountToken, code, callback) {
  var google_token_url = 'https://accounts.google.com/o/oauth2/token';
  request.post(google_token_url, {
    form:{
      'code':code,
      'client_id':googleAccountToken.client_id,
      'client_secret':googleAccountToken.client_secret,
      'redirect_uri':'urn:ietf:wg:oauth:2.0:oob',
      'grant_type':'authorization_code'
    }
  }, function (error, response, body) {
    var now, result;
    if (error) {
      return callback(error);
    }
    result = JSON.parse(body);
    if (result.error) {
      return callback(result.error);
    }
    now = new Date().getTime();
    googleAccountToken.access_token = result.access_token;
    googleAccountToken.expires_at = new Date(now + result.expires_in);
    googleAccountToken.refresh_token = result.refresh_token;
    googleAccountToken.save(function (err) {
      return callback(err);
    });
  });
}

middleware = function (req, res, next) {
  var username, client_id, google_auth_url, code, currentUrl = req.url, nextUrl = req.query.next || '/';
  if (req.method === 'GET') {
    client_id = req.query.client_id;
    google_auth_url = 'https://accounts.google.com/o/oauth2/auth?'
      + 'response_type=code'
      + '&client_id=' + client_id
      + '&redirect_uri=urn:ietf:wg:oauth:2.0:oob'
      + '&scope=https://www.googleapis.com/auth/calendar';
    return res.render('approval', { nextUrl:nextUrl, google_auth_url:google_auth_url });
  }
  nextUrl = req.body.next || '/';
  code = req.body.code;
  username = req.session.username;
  console.log('code :', code);
  console.log('username :', username);
  GoogleAccountToken.findOne({username:username}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    console.log('googleAccountToken :', googleAccountToken);
    if (googleAccountToken === null) {
      return res.redirect('/registration?next=' + currentUrl);
    }
    requestToken(googleAccountToken, code, function (err) {
      delete req.session.username;
      if (err) {
        return next(err);
      }
      req.session.user = {
        name:username,
        googleAccountToken:googleAccountToken
      };
      res.redirect(nextUrl);
    });
  });
};

module.exports = middleware;