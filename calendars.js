var calendarCrawler = require('./lib/calendar-crawler')
  , username = process.argv[2];

calendarCrawler.process(username, function (err, result) {
  if (err) {
    console.error(err.msg);
    if (err.err) {
      console.error('Error :', err.error.stack);
    }
    return;
  }
  result.forEach(function (calendar) {
    calendar.events.forEach(function (event) {
      console.log('[%s] - calendar %s : %s [%s - %s] @ %s',
        calendar.id,
        calendar.summary,
        event.summary,
        event.start,
        event.end,
        event.location
      );
    });
  });
});