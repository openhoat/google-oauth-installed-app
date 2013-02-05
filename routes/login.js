var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , request = require('request')
  , middleware;

function requestAuth(req, res, client_id, backUrl) {
  var google_auth_url = 'https://accounts.google.com/o/oauth2/auth?'
    + 'response_type=code'
    + '&client_id=' + client_id
    + '&redirect_uri=http://localhost:3000'
    + '&scope=https://www.googleapis.com/auth/calendar';
  return res.redirect(google_auth_url);
}

function requestToken(req, res, googleAccountToken, backUrl) {
  var google_token_url = 'https://accounts.google.com/o/oauth2/token';
  if (req.query.code === undefined) {
    return requestAuth(req, res, googleAccountToken.client_id, backUrl);
  }
  request.post(google_token_url, {form:{
    'code':req.query.code,
    'client_id':googleAccountToken.client_id,
    'client_secret':googleAccountToken.client_secret,
    'redirect_uri':'http://localhost:3000',
    'grant_type':'authorization_code'
  }}, function (error, response, body) {
    console.log('body :', body);
    var now, result = JSON.parse(body);
    if (error) {
      return res.send(500, error);
    }
    now = new Date().getTime();
    console.log('result.access_token :', result.access_token);
    googleAccountToken.access_token = result.access_token;
    googleAccountToken.expires_at = new Date(now + result.expires_in);
    googleAccountToken.refresh_token = result.refresh_token;
    googleAccountToken.save(function (err) {
      if (err) {
        return res.send(500, err);
      }
      return res.redirect(backUrl);
    });
  });
}

middleware = function (req, res, next) {
  var username, currentUrl = req.url, nextUrl = req.query.next || '/';
  if(req.session.username === undefined && req.method === 'GET') {
    return res.render('loginForm', { nextUrl:nextUrl });
  }
  nextUrl = req.query.next || req.body.next || '/';
  username = req.session.username || req.body.username;
  console.log('username :', username);
  GoogleAccountToken.findOne({username:username}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    console.log('googleAccountToken :', googleAccountToken);
    req.session.username = username;
    if (googleAccountToken === null) {
      console.log('googleAccountToken is null');
      return res.redirect('/registration?next=' + currentUrl);
    }
    if (googleAccountToken.access_token === undefined) {
      console.log('googleAccountToken.access_token is undefined');
      return requestToken(req, res, googleAccountToken, currentUrl);
    }
    delete req.session.username;
    req.session.user = {
      name:username,
      googleAccountToken:googleAccountToken
    };
    res.redirect(nextUrl);
  });
};

module.exports = middleware;