var mDb = require("mongodb");
var settings = require("../settings"),
    Db = mDb.Db,
    Connection = mDb.Connection,
    Server = mDb.Server;
module.exports = new Db(settings.db, new Server(settings.host,Connection.DEFAULT_PORT), { safe: true });
