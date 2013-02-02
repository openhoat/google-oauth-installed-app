var Step = require('step')
  , request = require('request')
  , GoogleCalendar = require('google-calendar')
  , db = require('./lib/db')
  , GoogleAccountToken = db.GoogleAccountToken;

function exitError() {
  console.log('exitError');
  var argumentsArray = Array.prototype.slice.apply(arguments);
  console.error.apply(this, argumentsArray);
  db.disconnect();
}

function complete(calendarList, accountToken, googleCalendar) {
  console.log('complete');
  calendarList.items.forEach(function (calendar) {
    googleCalendar.listEvent(accountToken.access_token, calendar.id, function (err, events) {
      if (events.items === undefined) {
        console.log('[%s] - calendar %s : no event', calendar.id, calendar.summary);
        return;
      }
      events.items.forEach(function (event) {
        console.log('[%s] - calendar %s : %s [%s - %s] @ %s',
          calendar.id,
          calendar.summary,
          event.summary,
          event.start.dateTime,
          event.end.dateTime,
          event.location
        );
      });
    });
  });
  db.disconnect();
}

function buildGoogleCalendar(accountToken) {
  console.log('buildGoogleCalendar');
  return new GoogleCalendar.GoogleCalendar(
    accountToken.client_id,
    accountToken.client_secret,
    'http://localhost:3000'
  );
}

function findAccountToken(AccountToken, username, callback) {
  console.log('findAccountToken');
  AccountToken.findOne({ username:username }, function (err, accountToken) {
    callback(err, username, accountToken);
  });
}

function loadGoogleCalendars(accountToken, googleCalendar, callback) {
  console.log('loadGoogleCalendars');
  googleCalendar.listCalendarList(accountToken.access_token, function (err, calendarList) {
    callback(err, calendarList, accountToken, googleCalendar);
  });
}

function refreshAccountToken(accountToken, callback) {
  console.log('refreshAccountToken');
  var googleTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  request.post(googleTokenUrl, {form:{
    'refresh_token':accountToken.refresh_token,
    'client_id':accountToken.client_id,
    'client_secret':accountToken.client_secret,
    'grant_type':'refresh_token'
  }}, callback);
}

(function () {
  var username = process.argv[2]
    , googleCalendar
    , googleAccountToken;
  Step(
    function () {
      findAccountToken(GoogleAccountToken, username, this);
    },
    function (err, username, accountToken) {
      if (err) {
        return exitError('find account token error :', err);
      }
      if (accountToken === null) {
        return exitError('account token not found for : %s', username);
      }
      googleAccountToken = accountToken;
      googleCalendar = buildGoogleCalendar(googleAccountToken);
      loadGoogleCalendars(googleAccountToken, googleCalendar, this);
    },
    function (err, calendarList, googleAccountToken, googleCalendar) {
      if (err) {
        if (err.error && err.error.code === 401) {
          console.log('access token expired');
          var google_token_url = 'https://accounts.google.com/o/oauth2/token';
          refreshAccountToken(googleAccountToken, this);
        } else {
          return exitError('load calendar list error :', err);
        }
      } else {
        complete(calendarList, googleAccountToken, googleCalendar);
      }
    },
    function (error, response, body) {
      var now, result = JSON.parse(body);
      if (error) {
        return exitError('refresh token error :', error);
      }
      now = new Date().getTime();
      googleAccountToken.access_token = result.access_token;
      googleAccountToken.expires_at = new Date(now + result.expires_in);
      googleAccountToken.save(function (err) {
        if (err) {
          return exitError('save access token error :', err);
        }
        loadGoogleCalendars(googleAccountToken, googleCalendar, this);
      });
    },
    function (err, calendarList, googleCalendarAccountToken, google_calendar) {
      if (err) {
        return exitError('load calendar list error :', err);
      }
      complete(calendarList, googleCalendarAccountToken, google_calendar);
    }
  );
})();