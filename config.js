var config = {
  port:3000,
  routes:[
    { url:'/', middleware:'home', method:'get' },
    { url:'/login', middleware:'login' },
    { url:'/logout', middleware:'logout', method:'get' },
    { url:'/registration', middleware:'registration' },
    { url:'/approval', middleware:'approval' },
    { url:'/account', middleware:'account' },
    { url:'/calendars', middleware:'calendars' },
    { url:'/events/:calendarId', middleware:'events' }
  ]
};

module.exports = config;