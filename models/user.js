var mongodb = require("./db");
function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};
module.exports = User;
//存储用户信息
User.prototype.save = function (callback) {
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(user, { safe: true }, function (err, user) {
                mongodb.close();
                if (err) return callback(err);
                callback(null,user[0]);//成功 err为空，并返回成功的用户稳定
            });
        });
    });
};
User.get = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查找用户名（name键）值为name一个文档
            collection.findOne({
                name: name
            }, function (err, user) {
                mongodb.close();
                if (err) return callback(err);
                callback(null, user);//成功返回查询的用户信息
            });
        });
    });
};