var async = require('async')
  , request = require('request')
  , db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken;

function requestAuth(req, res, client_id) {
  var google_auth_url = 'https://accounts.google.com/o/oauth2/auth?'
    + 'response_type=code'
    + '&client_id=' + client_id
    + '&redirect_uri=http://localhost:3000'
    + '&scope=https://www.googleapis.com/auth/calendar';
  return res.redirect(google_auth_url);
}

function requestToken(req, res, googleAccountToken) {
  var google_token_url = 'https://accounts.google.com/o/oauth2/token';
  if (req.query.code === undefined) {
    return requestAuth(req, res, googleAccountToken.client_id);
  }
  request.post(google_token_url, {form:{
    'code':req.query.code,
    'client_id':googleAccountToken.client_id,
    'client_secret':googleAccountToken.client_secret,
    'redirect_uri':'http://localhost:3000',
    'grant_type':'authorization_code'
  }}, function (error, response, body) {
    var now, result = JSON.parse(body);
    if (error) {
      return res.send(500, error);
    }
    now = new Date().getTime();
    googleAccountToken.access_token = result.access_token;
    googleAccountToken.expires_at = new Date(now + result.expires_in);
    googleAccountToken.refresh_token = result.refresh_token;
    googleAccountToken.save(function (err) {
      if (err) {
        return res.send(500, err);
      }
      res.render('complete', { googleAccountToken:googleAccountToken });
    });
  });
}

module.exports = function (req, res, next) {
  if (req.session.username === undefined) {
    return res.redirect('/login?next=/');
  }
  GoogleAccountToken.findOne({username:req.session.username}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    if (googleAccountToken === null) {
      return res.redirect('/registration?next=/');
    }
    if (googleAccountToken.access_token === undefined) {
      return requestToken(req, res, googleAccountToken);
    }
    res.render('complete', { googleAccountToken:googleAccountToken });
  });
};