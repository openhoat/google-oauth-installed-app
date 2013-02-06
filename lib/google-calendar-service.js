var async = require('async')
  , Step = require('step')
  , request = require('request')
  , GoogleCalendar = require('google-calendar')
  , db = require('./db')
  , GoogleAccountToken = db.GoogleAccountToken
  , googleTokenUrl = 'https://accounts.google.com/o/oauth2/token';

function findAccountToken(AccountToken, username, callback) {
  console.log('finding account token');
  AccountToken.findOne({ username:username }, function (err, accountToken) {
    callback(err, accountToken);
  });
}

function saveAccountToken(AccountToken, accountToken, callback) {
  console.log('saving account token');
  AccountToken.findOne({ _id:accountToken._id }, function (err, storedAccountToken) {
    if(err){
      return callback(err);
    }
    storedAccountToken.access_token = accountToken.access_token;
    storedAccountToken.client_id = accountToken.client_id;
    storedAccountToken.client_secret = accountToken.client_secret;
    storedAccountToken.expires_at = accountToken.expires_at;
    storedAccountToken.refresh_token = accountToken.refresh_token;
    storedAccountToken.username = accountToken.username;
    storedAccountToken.save(function (err) {
      callback(err, storedAccountToken);
    });
  });
}

function GoogleCalendarService(googleAccountToken) {
  if (typeof googleAccountToken === 'string') {
    this.username = googleAccountToken;
    this.googleAccountToken = null;
  } else {
    this.username = googleAccountToken.username;
    this.googleAccountToken = googleAccountToken;
  }
  this.googleCalendar = null;
}

GoogleCalendarService.prototype.getUserName = function () {
  return this.username;
};

GoogleCalendarService.prototype.getGoogleAccountToken = function () {
  return this.googleAccountToken;
};

GoogleCalendarService.prototype.init = function (callback) {
  console.log('intialize google calendar service');
  var that = this
    , complete = function () {
      that.googleCalendar = new GoogleCalendar.GoogleCalendar(
        that.googleAccountToken.client_id,
        that.googleAccountToken.client_secret,
        'urn:ietf:wg:oauth:2.0:oob'
      );
      callback();
    };
  if (that.googleAccountToken === null) {
    findAccountToken(GoogleAccountToken, that.username, function (err, accountToken) {
      if (err) {
        return callback(err);
      }
      if (accountToken === null) {
        return callback(new Error('account token not found for : ' + that.username));
      }
      that.googleAccountToken = accountToken;
      complete();
    });
  } else {
    complete();
  }
};

GoogleCalendarService.prototype.refreshAccountToken = function (callback) {
  console.log('refresh account token');
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
    saveAccountToken(GoogleAccountToken, that.googleAccountToken, function (err) {
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
          return err ? callback(err) : GoogleCalendarService.prototype.loadCalendars.call(that, option, callback, false);
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
          return err ? callback(err) : GoogleCalendarService.prototype.loadCalendarEvents.call(that, calendarId, option, callback, false);
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
          return err ? callback(err) : GoogleCalendarService.prototype.addCalendarEvent.call(that, calendarId, calendarEvent, option, callback, false);
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
          return err ? callback(err) : GoogleCalendarService.prototype.updateCalendarEvent.call(that, calendarId, calendarEventId, calendarEvent, option, callback, false);
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