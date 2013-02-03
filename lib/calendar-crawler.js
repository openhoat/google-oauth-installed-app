var async = require('async')
  , Step = require('step')
  , request = require('request')
  , GoogleCalendar = require('google-calendar')
  , db = require('./db')
  , GoogleAccountToken = db.GoogleAccountToken
  , googleTokenUrl = 'https://accounts.google.com/o/oauth2/token';

function buildGoogleCalendar(accountToken) {
  return new GoogleCalendar.GoogleCalendar(
    accountToken.client_id,
    accountToken.client_secret,
    'http://localhost:3000'
  );
}

function findAccountToken(AccountToken, username, callback) {
  AccountToken.findOne({ username:username }, function (err, accountToken) {
    callback(err, username, accountToken);
  });
}

function loadGoogleCalendars(accountToken, googleCalendar, callback) {
  googleCalendar.listCalendarList(accountToken.access_token, function (err, calendarList) {
    callback(err, calendarList, accountToken, googleCalendar);
  });
}

function loadGoogleCalendarEvents(calendarList, accountToken, googleCalendar, callback) {
  var result = [];
  async.forEach(calendarList.items, function (calendar, nextCalendar) {
    var cal = {
      id:calendar.id,
      summary:calendar.summary,
      events:[]
    };
    result.push(cal);
    googleCalendar.listEvent(accountToken.access_token, calendar.id, function (err, events) {
      if (err) {
        return nextCalendar(err);
      }
      if (events.items === undefined) {
        return nextCalendar();
      }
      async.forEach(events.items, function (event, nextEvent) {
        var calEvent = {
          summary:event.summary,
          location:event.location
        };
        if (event.start) {
          calEvent.start = event.start.dateTime;
        }
        if (event.end) {
          calEvent.end = event.end.dateTime;
        }
        cal.events.push(calEvent);
        nextEvent();
      }, function (err) {
        nextCalendar(err);
      });
    });
  }, function (err) {
    try {
      callback(err, result);
    } finally {
      db.disconnect();
    }
  });
}

function refreshAccountToken(accountToken, callback) {
  request.post(googleTokenUrl, {form:{
    'refresh_token':accountToken.refresh_token,
    'client_id':accountToken.client_id,
    'client_secret':accountToken.client_secret,
    'grant_type':'refresh_token'
  }}, callback);
}

function exitError(msg, err, callback) {
  try {
    return callback({ msg:msg, error:err });
  } finally {
    db.disconnect();
  }
}

var crawler = {
  googleCalendar:null,
  googleAccountToken:null,
  process:function (username, callback) {
    Step(
      function () {
        findAccountToken(GoogleAccountToken, username, this);
      },
      function (err, username, accountToken) {
        if (err) {
          return exitError('find account token error', err, callback);
        }
        if (accountToken === null) {
          return exitError('account token not found for : ' + username, null, callback);
        }
        crawler.googleAccountToken = accountToken;
        crawler.googleCalendar = buildGoogleCalendar(crawler.googleAccountToken);
        loadGoogleCalendars(crawler.googleAccountToken, crawler.googleCalendar, this);
      },
      function (err, calendarList, googleAccountToken, googleCalendar) {
        if (err) {
          if (err.error && err.error.code === 401) {
            refreshAccountToken(googleAccountToken, this);
          } else {
            return exitError('load calendar list error', err, callback);
          }
        } else {
          loadGoogleCalendarEvents(calendarList, googleAccountToken, googleCalendar, callback);
        }
      },
      function (error, response, body) {
        var now = new Date().getTime()
          , result = JSON.parse(body);
        if (error) {
          return exitError('refresh token error :', error);
        }
        crawler.googleAccountToken.access_token = result.access_token;
        crawler.googleAccountToken.expires_at = new Date(now + result.expires_in);
        crawler.googleAccountToken.save(this);
      },
      function (err) {
        if (err) {
          return exitError('save access token error', err, callback);
        }
        loadGoogleCalendars(crawler.googleAccountToken, crawler.googleCalendar, this);
      },
      function (err, calendarList, googleCalendarAccountToken, google_calendar) {
        if (err) {
          return exitError('load calendar list error', err, callback);
        }
        loadGoogleCalendarEvents(calendarList, googleCalendarAccountToken, google_calendar, callback);
      }
    );
  }
};

module.exports = {
  process:crawler.process
};