var async = require('async')
  , Step = require('step')
  , request = require('request')
  , GoogleCalendar = require('google-calendar')
  , db = require('./db')
  , GoogleAccountToken = db.GoogleAccountToken
  , googleTokenUrl = 'https://accounts.google.com/o/oauth2/token';

function findAccountToken(AccountToken, username, callback) {
  console.log('findind account token');
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
  console.log('saving account token');
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
  console.log('intialize google calendar service');
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
  console.log('refresh google calendar service');
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

GoogleCalendarService.prototype.loadCalendars = function (option, callback, refreshTokenIfNeeded) {
  console.log('loading calendars');
  if (refreshTokenIfNeeded === undefined) {
    refreshTokenIfNeeded = true;
  }
  if (callback === undefined) {
    callback = option;
    option = null;
  }
  var that = this;
  that.googleCalendar.listCalendarList(that.googleAccountToken.access_token, option, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401 && refreshTokenIfNeeded) {
        that.refreshAccountToken(function (err) {
          return err ? callback(err) : arguments.callee.call(that, option, callback, false);
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result);
    }
  });
};

GoogleCalendarService.prototype.loadCalendarEvents = function (calendarId, option, callback, refreshTokenIfNeeded) {
  console.log('loading calendar events');
  if (refreshTokenIfNeeded === undefined) {
    refreshTokenIfNeeded = true;
  }
  if (callback === undefined) {
    callback = option;
    option = null;
  }
  var that = this;
  that.googleCalendar.listEvent(that.googleAccountToken.access_token, calendarId, option, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401 && refreshTokenIfNeeded) {
        that.refreshAccountToken(function (err) {
          return err ? callback(err) : arguments.callee.call(that, calendarId, option, callback, false);
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result);
    }
  });
};

GoogleCalendarService.prototype.addCalendarEvent = function (calendarId, calendarEvent, option, callback, refreshTokenIfNeeded) {
  console.log('adding calendar event');
  if (refreshTokenIfNeeded === undefined) {
    refreshTokenIfNeeded = true;
  }
  if (callback === undefined) {
    callback = option;
    option = null;
  }
  var that = this;
  that.googleCalendar.insertEvent(that.googleAccountToken.access_token, calendarId, calendarEvent, option, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401 && refreshTokenIfNeeded) {
        that.refreshAccountToken(function (err) {
          return err ? callback(err) : arguments.callee.call(that, calendarId, calendarEvent, option, callback, false);
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result);
    }
  });
};

GoogleCalendarService.prototype.updateCalendarEvent = function (calendarId, calendarEventId, calendarEvent, option, callback, refreshTokenIfNeeded) {
  console.log('updating calendar event');
  if (refreshTokenIfNeeded === undefined) {
    refreshTokenIfNeeded = true;
  }
  if (callback === undefined) {
    callback = option;
    option = null;
  }
  var that = this;
  that.googleCalendar.updateEvent(that.googleAccountToken.access_token, calendarId, calendarEventId, calendarEvent, option, function (err, result) {
    if (err) {
      if (err.error && err.error.code === 401 && refreshTokenIfNeeded) {
        that.refreshAccountToken(function (err) {
          return err ? callback(err) : arguments.callee.call(that, calendarId, calendarEventId, calendarEvent, option, callback, false);
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result);
    }
  });
};

module.exports = GoogleCalendarService;