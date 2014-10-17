var mongodb = require('./db.js');
var collectionName = "posts";
function Comment(name, title, comment) {
    this.name = name;
    this.title = title;
    this.comment = comment;
}
module.exports = Comment;
Comment.prototype.save = function (callback) {
    var name = this.name;
    var title = this.title;
    var comment = this.comment;
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name": name,
                "title": title
            }, {
                $push: {
                    "comments": comment
                }
            }, function (err) {
                mongodb.close();
                if (err) return callback(err);
                callback(null);//成功 err为空，并返回成功的用户稳定
            });
        });
    });
}