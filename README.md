## Description

This sample is splitted in two parts :

- app.js : a web application doing the Google Api Auth and Approval process.

  Collected access tokens are stored into a mongo db

- calendars.js : a batch script that show Google Calendars events based on stored access tokens.

  Tokens are refreshed when expired.

## Usage

Start the web app:

    $ node app

Browse: http://localhost:3000/

Follow the usual Google Auth process.

Once the tokens confirmation page appears, start the batch:

    $ node calendars myusername

Feel free to do what you want with this peace of code !
