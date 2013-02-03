var mongoose = require('mongoose')
  , googleAccountTokenSchema
  , GoogleAccountToken;

googleAccountTokenSchema = mongoose.Schema({
  username:'string',
  client_id:'string',
  client_secret:'string',
  access_token:'string',
  expires_at:'Date',
  refresh_token:'string'
});

GoogleAccountToken = mongoose.model('GoogleAccountToken', googleAccountTokenSchema);

var db = {
  GoogleAccountToken:GoogleAccountToken,
  connected:false,
  isConnected:function () {
    return db.connected;
  },
  connect:function () {
    mongoose.connect('localhost', 'test');
    db.connected = true;
  },
  disconnect:function () {
    mongoose.disconnect();
    db.connected = false;
  }
};

module.exports = db;