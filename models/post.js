var mongodb = require("./db");
var markdown = require('markdown').markdown;
var collectionName = "posts";
function Post(name,head,title,tags,post) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
    this.head = head;
};
module.exports = Post;
//存储用户信息
Post.prototype.save = function (callback) {
    var date = new Date();
    var post = {
        name: this.name,
        head:this.head,
        time: date,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
        pv:0
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
Post.getOne = function (whereObj, callback,isMardown,isNeedPV) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection(collectionName, function (err, collection) {
            if (err) { 
                mongodb.close();
                return callback(err);
            }
            collection.findOne(whereObj, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (doc && isNeedPV) {
                    collection.update(whereObj, {
                        $inc: 
 {
                            "pv": 1
                        }
                    }, function (err) {
                        mongodb.close();
                        if (err) return callback(err);
                    });
                } else { 
                    mongodb.close();
                }
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

//删除一篇文章
Post.remove = function (name, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询要删除的文档
            collection.findOne({
                "name": name,
                "title": title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
                var reprint_from = "";
                if (doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if (reprint_from != "") {
                    //更新原文章所在文档的 reprint_to
                    collection.update({
                        "name": reprint_from.name,
                        "time.day": reprint_from.day,
                        "title": reprint_from.title
                    }, {
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": name,
                                "title": title
                            }
                        }
                    }, function (err) {
                        if (err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }
                
                //删除转载来的文章所在的文档
                collection.remove({
                    "name": name,
                    "title": title
                }, {
                    w: 1
                }, function (err) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            },true,false);
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
//返回通过标题关键字查询的素有恩子信息
Post.Search = function (keyword,callback) {
    mongodb.open(function (err, db) {
        db.collection(collectionName, function (err, collection) {
            if (err) mongodb.close();
            var selTitle = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({
                title: selTitle
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({ "time": -1 }).toArray(function (err, docs) {
                mongodb.close();
                if (err) return callback(err);
                callback(null, docs);
            });
        });
    });
};

//转载
Post.reprint = function (reprint_from, reprint_to, callback) {
    mongodb.open(function (err, db) {
        db.collection(collectionName, function (err, collection) {
            if (err) {
                mongodb.close();
                callback(err);
            }
            collection.findOne({
                "name": reprint_from.name,
                "title": reprint_from.title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                var date = new Date();
                var time = date;
                delete doc._id;
                
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1)?doc.title:"[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = { "reprint_from": reprint_from };
                doc.pv = 0;
                
                //更新被转载的源文档
                collection.update({
                    "name": reprint_from.name,
                    "title": reprint_from.title
                }, {
                    $push : {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "time": time,
                            "title": doc.title
                        }
                    }
                }, function (err) {
                    if (err) {
                        mongodb.close();
                        callback(err);
                    }
                });

                //转载文本入库
                collection.insert(doc, { safe: true }, function (err, post) {
                    mongodb.close();
                    if (err) callback(err);
                    callback(err,post[0]);
                });
            });
        });
    });
};