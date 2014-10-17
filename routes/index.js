
/*
 * GET home page.
 */
var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var h = require('../models/helper.js');
module.exports = function (app) {
    //主页
    app.get('/', function (req, res) {
        var page = req.query.p?parseInt(req.query.p):1;
        var pageSize =5;
        Post.getAllList(null,page, pageSize, function (err,posts, total) {
            if (err) posts = [];
            var length = posts.length;
            res.render('index', {
                title: "主页",
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage:((page-1)* pageSize+length)==total,
                user: req.session.user,
                posts:posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: "注册",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name, password = req.body.password, password_re = req.body['password-repeat'];
        if (password != password_re) {
            req.flash('error', '两次输入的密码不一样');
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        var newuser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        User.get(newuser.name, function (err, user) {
            if (user) {
                req.flash('err', '用户已经存在!');
                return res.redirect('/reg');
            }
            newuser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功!');
                res.redirect('/');
            });
        });
    });
    //登陆
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: "登陆",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req,res) {
        var name = req.body.name;
        var password = req.body.password;
        var md5 = crypto.createHash('md5');
        password = md5.update(password).digest('hex');
        User.get(name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/Login');
            }   
            if (user.password != password) { 
                req.flash('error', '密码输入错误!');
                return res.redirect('/Login');
            }
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');
        });
    });
    //上传文件
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: "文件上传",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            if (req.files[i].size == 0) {
                fs.unlinkSync(req.files[i].path);
                console.log("删除一个空文件！");
            } else {
                var path = './public/images/' + req.files[i].name;
                fs.renameSync(req.files[i].path, path);
                console.log("使用同步方式重命名一个文件！");
            }
        }
        req.flash('success', '文件上传成功!');
        res.redirect('/upload');
    });
    //获取用户的发布微博列表
    //app.get('/u/:name', checkLogin);
    app.get('/u/:name', function (req, res) {
        var loginUser = req.session.user;
        var selUserName = req.params.name;
        var page = req.query.p?parseInt(req.query.p):1;
        var pageSize = 5;
        if (!loginUser) { 
            req.flash('error', '用户不存在！');
            return res.redirect('/');
        }
        //查询用户所有的文章
        Post.getAllList(selUserName, page, pageSize, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            var length = posts.length;
            res.render('index', {
                title: selUserName,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * pageSize + length) == total,
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //获取用详细的微博详情
    app.get('/u/:name/:title', function (req, res) {
        var name=req.params.name;
        var title = req.params.title;
        Post.getOne({
            name: req.params.name,
            title:req.params.title
        }, function (err, post) { 
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        },true);
    });
    
    //获取用详细的微博详情
    app.post('/u/:name/:title', function (req, res) {
        var date = new Date();
        time = date;
        var md5 = crypto.createHash('md5');
        var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
        var head = "http://en.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var comment = {
            name: req.body.name,
            head:head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功!');
            return res.redirect('back');
        });
    });
    //标题查询
    app.get('/search', function (req, res) {
        var title = req.query.keyword;
        if (!title) { 
            req.flash('error', '无');
            return res.redirect('/');
        }
        Post.Search(title, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title:"SEARCH："+ title,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });  
        })
    });
    //存档
    app.get('/archive', function (req, res ) {
         Post.getArchive(function (err, posts) { 
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('archive', {
                title: "存档",
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        })
    });
    //标签列表
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, tags) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: "标签",
                tags: tags,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    //获取标签下的所有微博
    app.get('/tags/:tag', function (req,res) {
        var user = req.session.user;
        var tag = req.params.tag;
        if (!tag|| tag=='underfine') { 
            req.flash('error', '错误操作！');
            return res.redirect('/');
        }
        Post.getTag(tag, function (err, posts) { 
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: "TAG:"+tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        })
    });

    
    //编辑
    app.get('/edit/:name/:title', checkLogin);
    app.get('/edit/:name/:title', function (req, res) {
        var loginUser = req.session.user;
        var name = req.params.name;
        if (name != loginUser.name) {
            req.flash('error', '您没有修改文章的权限');
            return res.redirect("/");
        }
        Post.getOne({
            name: loginUser.name,
            title: req.params.title
        }, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('edit', {
                title: "编辑",
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }, false);
    });
    app.post('/edit/:name/:title', checkLogin);
    app.post('/edit/:name/:title', function (req, res) {
        var name = req.params.name;
        var title = req.params.title;
        var url = '/u/{name}/{title}';
        var user = req.session.user;
        if (name != user.name) {
            req.flash('error', '您没有修改文章的权限');
            return res.redirect(url);
        }
        url = url.replace("{name}", name).replace("{title}",title);
        Post.Update({
            name: user.name,
            title:title
        },{post:req.body.post}, function (err){ 
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', '修改成功！')
            res.redirect(url);
        })
    });
    //删除
    app.get('/remove/:name/:title', checkLogin);
    app.get('/remove/:name/:title', function (req, res) { 
        var name = req.params.name;
        var title = req.params.title;
        var user = req.session.user;
        if (name != user.name) {
            req.flash('error', '您没有修改文章的权限');
            return res.redirect("/");
        }
        Post.remove({
            name:name,
            title:title
        }, function (err) { 
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', '删除成功！');
            res.redirect("/");
        });
    });

    //发表
    app.get('/post',checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: "发表",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var user = req.session.user;
        var title = req.body.title;
        var post = req.body.post;
        var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
        var mPost = new Post(user.name,user.head, title, tags, post);
        mPost.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');
        });
    });
    //退出登陆
    app.get('/logout', checkLogin);
    app.get("/logout", function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });
    //404
    app.use(function (req, res) {
        res.render("404");
    });
    //转载
    app.get('/reprint/:name/:title', checkLogin);
    app.get('/reprint/:name/:title', function (req, res) {
        Post.getOne({
            "name": req.params.name,
            "title": req.params.title
        }, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            var user = req.session.user;
            var reprint_from = {
                name: post.name,
                time: post.time,
                title: post.title
            };
            var reprint_to = {
                name: user.name,
                head:user.head
            };
            Post.reprint(reprint_from, reprint_to, function (err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                req.flash('success', '转载成功！');
                var url = '/u/' + post.name + '/' + post.title;
                res.redirect(url);
            });
        }, true,false);
    });


};



//帮助方法
//判断是否登陆
function checkLogin(req, res, next) {
    if (req.session.user) {
        next();
        return;
    }
    req.flash('error', '未登录');
    res.redirect('/login');
}
//判断是否登出
function checkNotLogin(req, res, next) {
    if (!req.session.user) {
        next();
        return;
    }
    req.flash('error', '已登陆');
    res.redirect('back');
}