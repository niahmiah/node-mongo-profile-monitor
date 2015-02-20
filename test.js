var Profilemon = require('./index');
var profilemon = new Profilemon({url: 'mongodb://localhost:27017/test'});

profilemon.on('profilemon', function(data){
  console.log('profilemon',JSON.stringify(data));
});

profilemon.start();

//then do something really slow in the collection and watch it emit