'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var MongoClient = require('mongodb').MongoClient;

function ProfileMon(options){
  this.url = options.url;
  this.connection = options.connection;
  this.selfConnected = false;
  this.slowms = options.slowms || 1000;
}

util.inherits(ProfileMon, EventEmitter);

ProfileMon.prototype.connect = function(callback){
  var self = this;
  if(!self.connection){
    MongoClient.connect(self.url, function(err, db){
      if(db){ 
        self.connection = db;
        self.selfConnected = true;
      }
      callback(err);
    });
  }else{
    callback(null);
  }
};

ProfileMon.prototype.disconnect = function(){
  if(this.connection && this.selfConnected){
    this.connection.close();
    this.connection = null;
    this.selfConnected = false;
  }
};

ProfileMon.prototype.streamProfile = function(doc){
  var self = this;
  var query = ({'ts': {'$gt': doc.ts}});
  self.cursor = self.connection.collection('system.profile').find(query,{},{
    'tailable': 1,
    'sort': {
        '$natural': 1
    }
  });
  self.cursor.each(function (err, profileDoc) {
    if(err){ throw err; }
    self.emit('profilemon', profileDoc);
  });
};

ProfileMon.prototype.start = function(callback){
  var self = this;
  self.connect(function(err){
    if(err){ throw err; }
    self.connection.command({profile: 1, slowms: self.slowms}, function(err){
      if(err){ throw err; }
      self.connection.collection('system.profile').findOne(
        {}, 
        {limit: 1, sort: {'$natural': -1}},
        function(err, doc){
          if(err){ throw err; }
          if(!doc){
            doc = {ts: new Date() };
            self.connection.collection('system.profile').insert(doc, function(err){
              if(err){ throw err; }
              self.streamProfile(doc);
            });
          }else{
            self.streamProfile(doc);
          }
          if(callback){ callback(); }
        }
      );
    });
  });
};

ProfileMon.prototype.stop = function(){
  var self = this;
  if(self.cursor){ 
    self.cursor.close(); 
    self.cursor = null;
  }
  this.disconnect();
};

module.exports = ProfileMon;