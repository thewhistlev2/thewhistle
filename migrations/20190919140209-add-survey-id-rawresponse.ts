'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options: any, seedLink: any) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db: any, callback: any) {
  db.addColumn('rawresponse', 'form_id', {type: 'string'}, callback);
};

exports.down = function(db: any, callback: any) {
  db.removeColumn('rawresponse', 'form_id', callback);
};

exports._meta = {
  "version": 1
};
