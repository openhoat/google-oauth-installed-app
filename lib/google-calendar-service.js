var async = require('async')
  , Step = require('step')
  , request = require('request')
  , GoogleCalendar = require('google-calendar')
  , db = require('./db')
  , GoogleAccountToken = db.GoogleAccountToken
  , googleTokenUrl = 'https://accounts.google.com/o/oauth2/token';

function findAccountToken(AccountToken, username, callback) {
  if (!db.isConnected()) {
    db.connect();
  }
  AccountToken.findOne({ username:username }, function (err, accountToken) {
    try {
      callback(err, accountToken);
    } finally {
      db.disconnect();
    }
  });
}

function saveAccountToken(accountToken, callback) {
  if (!db.isConnected()) {
    db.connect();
  }
  accountToken.save(function (err) {
    try {
      callback(err);
    } finally {
      db.disconnect();
    }
  });
}

function GoogleCalendarService(username) {
  this.username = username;
  this.googleCalendar = null;
  this.googleAccountToken = null;
}

GoogleCalendarService.prototype.init = function (callback) {
  var that = this;
  findAccountToken(GoogleAccountToken, that.username, function (err, accountToken) {
    if (err) {
      return callback(err);
    }
    if (accountToken === null) {
      return callback(new Error('account token not found for : ' + that.username));
    }
    that.googleAccountToken = accountToken;
    that.googleCalendar = new GoogleCalendar.GoogleCalendar(
      that.googleAccountToken.client_id,
      that.googleAccountToken.client_secret,
      'http://localhost:3000'
    );
    callback();
  });
};

GoogleCalendarService.prototype.refreshAccountToken = function (callback) {
  var that = this;
  request.post(googleTokenUrl, {
    form:{
      'refresh_token':that.googleAccountToken.refresh_token,
      'client_id':that.googleAccountToken.client_id,
      'client_secret':that.googleAccountToken.client_secret,
      'grant_type':'refresh_token'
    }
  }, function (error, response, body) {
    var now, result;
    if (error) {
      return callback(error);
    }
    now = new Date().getTime();
    result = JSON.parse(body);
    that.googleAccountToken.access_token = result.access_token;
    that.googleAccountToken.expires_at = new Date(now + result.expires_in);
    saveAccountToken(that.googleAccountToken, function (err) {
      return callback(err);
    });
  });
};

GoogleCalendarService.prototype.loadCalendars = function (callback) {
  var that = this;
  that.googleCalendar.listCalendarList(that.googleAccountToken.access_token, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401) {
        that.refreshAccountToken(function (err) {
          if (err) {
            return callback(err);
          }
          that.googleCalendar.listCalendarList(that.googleAccountToken.access_token, function (err, result) {
            if (err) {
              return callback(err);
            }
            return callback(null, result);
          });
        });
      }
    } else {
      return callback(null, result);
    }
  });
};

GoogleCalendarService.prototype.loadCalendarEvents = function (calendarId, callback) {
  var that = this;
  that.googleCalendar.listEvent(that.googleAccountToken.access_token, calendarId, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401) {
        that.refreshAccountToken(function (err) {
          if (err) {
            return callback(err);
          }
          that.googleCalendar.listEvent(that.googleAccountToken.access_token, calendarId, function (err, result) {
            if (err) {
              return callback(err);
            }
            return callback(null, result);
          });
        });
      }
    } else {
      return callback(null, result);
    }
  });
};

module.exports = GoogleCalendarService;