var mongodb = require("./db");
var markdown = require('markdown').markdown;
var collectionName = "posts";
function Post(name,title,tags,post) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
};
module.exports = Post;
//存储用户信息
Post.prototype.save = function (callback) {
    var date = new Date();
    var post = {
        name: this.name,
        time: date,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments:[]
    };
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, { safe: true }, function (err, user) {
                mongodb.close();
                if (err) return callback(err);
                callback(null);//成功 err为空，并返回成功的用户稳定
            });
        });
    });
};
//更具用户名获取列表
Post.getAll = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) query.name = name;
            //根据query对象查询文章
            collection.find(query).sort({
                time:-1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) return callback(err);
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null, docs);//成功！已数组的形式返回查询结果
            });
        });
    });
};
//更具用户名获取分页列表
Post.getAllList = function (name, pageNum, pageSize, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) query.name = name;
            collection.count(query, function (err, total) {
                //根据query对象查询文章
                collection.find(query, {
                    skip: (pageNum - 1) * pageSize,
                    limit: pageSize
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) return callback(err);
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);//成功！已数组的形式返回查询结果
                });
            });
            
        });
    });
};
//获取微博信息，根据条件
Post.getOne = function (whereObj, callback,isMardown) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) { 
                mongodb.close();
                return callback(err);
            }
            collection.findOne(whereObj, function (err, doc) {
                mongodb.close();
                if (err) return callback(err);
                if (isMardown) {
                    try {
                        doc.post = markdown.toHTML(doc.post);
                        if (doc.comments) {
                            doc.comments.forEach(function (comment) {
                                if (comment.content) comment.content = markdown.toHTML(comment.content);
                            });
                        }
                    } catch (ex) { 
                        return callback(ex);
                    }
                }
                callback(null, doc);//成功！已数组的形式返回查询结果
            });
        });
    }); 
};
//更新数据
Post.Update = function (whereObj, updateObj, callBack) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update(whereObj, { $set: updateObj }, function (err) {
                mongodb.close();
                if (err) return callBack(err);
                callBack(null);
            });
        });
    });
};

//删除数据
Post.remove = function (whereObj, callBack) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove(whereObj, {w:1}, function (err) {
                mongodb.close();
                if (err) return callBack(err);
                callBack(null);
            });
        });
    });
};

//返回所有文章的存档信息
Post.getArchive = function (callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({ time: -1 }).toArray(function (err, docs) {
                mongodb.close();
                if (err) return callback(err);
                callback(null, docs);
            });
        });
    });
};


//返回所有标签
Post.getTags = function (callback) {
    mongodb.open(function(err, db){
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection(collectionName, function (err, collection) {
            collection.distinct("tags", function (err, docs) {
                mongodb.close();
                if (err) return callback(err);
                callback(null,docs);
            });
        });
    });
};
//更具标签获取文章
Post.getTag = function (tag,callback) {
    mongodb.open(function (err, db) {
        db.collection(collectionName,function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1, 
                "title": 1
            }).sort({
                "time": -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) callback(err);
                callback(null, docs);
            });
        });
    });
}
