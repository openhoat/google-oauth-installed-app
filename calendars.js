var Step = require('step')
  , GoogleCalendar = require('google-calendar')
  , google_calendar
  , db = require('./lib/db')
  , GoogleCalendarAccountToken = db.GoogleCalendarAccountToken
  , access_token
  , username;

username = process.argv[2];

function done() {
  db.disconnect();
}

Step(
  function getGoogleCalendarAccountToken() {
    GoogleCalendarAccountToken.findOne({ username:username }, this);
  },
  function getGoogleCalendars(err, googleCalendarAccountToken) {
    if (googleCalendarAccountToken == null) {
      console.error('google calendar account token not found for : %s', username);
      return done();
    }
    access_token = googleCalendarAccountToken.access_token;
    google_calendar = new GoogleCalendar.GoogleCalendar(
      googleCalendarAccountToken.client_id,
      googleCalendarAccountToken.client_secret,
      'http://localhost:3000'
    );
    google_calendar.listCalendarList(googleCalendarAccountToken.access_token, this);
  },
  function logCalendarList(err, calendarList) {
    if (err) {
      console.log('logCalendarList error :', err);
      return done();
    }
    calendarList.items.forEach(function (calendar) {
      google_calendar.listEvent(access_token, calendar.id, function (err, events) {
        if(events.items===undefined){
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
    done();
  }
);