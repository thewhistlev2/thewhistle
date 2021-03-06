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

exports.up = function (db: any, callback: any) {
    db.createTable('audit', {
        id: {
            type: 'int',
            primaryKey: true,
            autoIncrement: true
        },
        report: 'int',
        user: 'int',
        time: 'datetime',
        action: 'string'
    }, addReportForeignKey);

    function addReportForeignKey(err: any) {
        if (err) {
            callback(err);
            return;
        }
        db.addForeignKey('audit', 'reports', 'report', {
            'report': 'id'
        }, {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        }, addUserForeignKey);
    }

    function addUserForeignKey(err: any) {
        if (err) {
            callback(err);
            return;
        }
        db.addForeignKey('audit', 'users', 'user', {
            'user': 'id'
        }, {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
        }, callback);
    }
};



exports.down = function (db: any, callback: any) {
    db.dropTable('audit', callback);
};

exports._meta = {
    "version": 1
};