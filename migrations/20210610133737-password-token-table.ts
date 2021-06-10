'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options: any, seedLink: any) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = function (db: any, callback: any): void {
    db.createTable(
        'passwordtokens', {
            id: {
                type: 'int',
                primaryKey: true,
                autoIncrement: true
            },
            user_id: 'int',
            token_hash: 'string',
            expiration: 'datetime',
            used: 'boolean'
        },
        addUserForeignKey
    );

    function addUserForeignKey(err: any) {
        if (err) {
            callback(err);
            return;
        }
        db.addForeignKey('passwordtokens', 'users', 'user_id', {
            'user_id': 'id'
        }, {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        }, callback);
    }
};



exports.down = function (db: any, callback: any) {
    db.dropTable('passwordtokens', callback);
};

exports._meta = {
    "version": 1
};