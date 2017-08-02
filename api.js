exports = module.exports = createAPI
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users = require('./db/users');
const posts = require('./db/posts');

const app = express();
const Users = users(mongoose)
const Posts = posts(mongoose)

function createAPI(dbHost) {
    mongoose.connect(dbHost, {
        useMongoClient: true
    });
    return app;
}
exports.express = express
const hbSecrute = "fbhbvyrgbvigervgefjbvkgr";
const hbToken = 'headbooktoken';
const hbCookies = 'headbookcookies';

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use(cookieParser());

function sendResponse(res, status, result, cookies) {
    console.log('sendResponse');
    if (cookies == "")
        res.status(status).cookie(hbCookies, "").json(result)
    else if (cookies != undefined)
        res.status(status).cookie(hbCookies, JSON.stringify(cookies)).json(result)
    else
        res.status(status).json(result);
}

function jsonRes(success = true, message = "", errorCode = 0, token = '') {
    return {
        success: success,
        message: message,
        errorCode: 0,
        token: token
    }
}

function init(req, res, next) {
    console.log('init');
    if (!req.body)
        req.body = {}
    req.body.hb = {
        isLogin: false,
        token: '',
        user: {}
    }
    next()
}

function checkLogin(req, res, next) {
    console.log('checkLogin');
    if (req.cookies)
        if (req.cookies[hbCookies])
            req.body.hb.isLogin = true
        else if (req.body.token)
        req.body.hb.isLogin = true
    next()
}

function findUser(req, res, next) {
    console.log('findUser');
    if (req.body.hb.isLogin)
        sendResponse(res, 200, jsonRes(false, "user loged in"))
    else if (!('email' in req.body))
        sendResponse(res, 200, jsonRes(false, "some parameters are missing"))
    else
        Users.findOne({
            email: req.body.email
        }, function(err, user) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            req.body.hb.user = user
            next()
        })
}

function encryptPassword(req, res, next) {
    console.log('encryptPassword');
    if (req.body.hb.user)
        sendResponse(res, 200, jsonRes(false, "user exist"))
    else {
        if (!('password' in req.body))
            sendResponse(res, 200, jsonRes(false, "some parameters are missing"))
        else {
            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
                    console.log(err)
                    sendResponse(res, 200, jsonRes(false, "Error"))
                } else
                    bcrypt.hash(req.body.password, salt, function(err, hash) {
                        if (err) {
                            console.log(err)
                            sendResponse(res, 200, jsonRes(false, "Error"))
                        } else {
                            req.body['hash'] = hash
                            next()
                        }
                    })
            })
        }
    }
}

function addUser(req, res, next) {
    console.log('addUser');
    let {
        name,
        email,
        password,
        hash
    } = req.body;
    if (!(name && email && password && hash))
        sendResponse(res, 200, jsonRes(false, "some parameters are missing"))
    else {
        let user = new Users({
            name: name,
            email: email,
            password: hash
        });
        user.save(function(err, user) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            } else {
                req.body.hb.user = user
                next()
            }
        });
    }
}

function setToken(user, expire) {
    console.log('setToken');
    if (!expire)
        expire = 60 * 60 * 24
    return jwt.sign(user, hbSecrute, {
        expiresIn: expire, // expires in 24 hours
    })
}
// curl -d "name=name&email=a@b.c&password=1234" http://localhost:3000/signup
app.post('/signup', init, checkLogin, findUser, encryptPassword, addUser, function(req, res) {
    if (req.body.hb.user instanceof Users)
        sendResponse(res, 200, jsonRes(true, "user added"))
    else
        sendResponse(res, 200, jsonRes(false, "Error"))
})

function checkPassword(req, res, next) {
    console.log('checkPassword');
    if (!req.body.hb.user)
        sendResponse(res, 200, jsonRes(false, "user not found"))
    else {
        bcrypt.compare(req.body.password, req.body.hb.user.password, function(err, same) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            if (!same)
                sendResponse(res, 200, jsonRes(false, "email and/or password not correct"))
            else
                next()
        })
    }
}
// curl -d "email=a@b.c&password=1234" http://localhost:3000/login
app.post('/login', init, checkLogin, findUser, checkPassword, function(req, res) {
        if (req.body.hb.user instanceof Users) {
            let token = setToken(req.body.hb.user)
            sendResponse(res, 200, jsonRes(true, 'Authentication success.', 0, token), {
                [hbToken]: token,
                name: req.body.hb.user.name
            })
        } else
            sendResponse(res, 200, jsonRes(false, "Error"))
    })
    // curl -d "" http://localhost:3000/logout
app.post('/logout', function(req, res) {
    sendResponse(res, 200, jsonRes(true, "logout succsses"), "");
});

function getToken(req, res, next) {
    console.log('getToken');
    // console.log(req.cookies)
    console.log()
    if (req.cookies)
        if (req.cookies[hbCookies])
            req.body.hb.token = JSON.parse(req.cookies[hbCookies])[hbToken]
        else
            req.body.hb.token = req.header.token
    next()
}

function verifyToken(req, res, next) {
    console.log('verifyToken');
    if (!req.body.hb.token)
        sendResponse(res, 200, jsonRes(false, "you should login"))
    else {
        jwt.verify(req.body.hb.token, hbSecrute, function(err, decoded) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            req.body.hb.user = decoded
            next()
        });
    }
}

function addPost(req, res, next) {
    console.log('addPost');
    if (!req.body.hb.user)
        sendResponse(res, 200, jsonRes(false, "user not authorized"))
    else {
        var post = new Posts({
            user_id: req.body.hb.user._doc._id,
            name: req.body.hb.user._doc.name,
            post: req.body.post,
            time: Date.now()
        });
        post.save((err, post) => {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            req.body.hb['post'] = post
            next()
        });
    }
}
// curl -d "token=token&post=post" http://localhost:3000/posts
app.post('/posts', init, getToken, verifyToken, addPost, function(req, res) {
    if (req.body.hb.post)
        sendResponse(res, 200, jsonRes(true, req.body.hb.post))
    else
        sendResponse(res, 200, jsonRes(false, "Error"))
});

function allPosts(req, res, next) {
    console.log('allPosts');
    if (!req.body.hb.user)
        sendResponse(res, 200, jsonRes(false, "user not authorized"))
    else
        Posts.find({}, function(err, posts) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            req.body.hb.posts = posts
            next()
        })
}
// curl -X "GETrs" "token=token&post=post" http://localhost:3000/posts
app.get('/posts', init, getToken, verifyToken, allPosts, function(req, res) {
    if (req.body.hb.posts)
        sendResponse(res, 200, jsonRes(true, req.body.hb.posts))
    else
        sendResponse(res, 200, jsonRes(false, "no posts found"))
});

function findPost(req, res, next) {
    console.log('findPost');
    if (!req.body.hb.user)
        sendResponse(res, 200, jsonRes(false, "user not authorized"))
    else if (!('id' in req.params))
        sendResponse(res, 200, jsonRes(false, "id not found"))
    else
        Posts.findOne({
            _id: req.params.id
        }, function(err, post) {
            if (err) {
                console.log(err)
                sendResponse(res, 200, jsonRes(false, "Error"))
            }
            req.body.hb.post = post
            next()
        })
}

app.get('/posts/:id', init, getToken, verifyToken, findPost, function(req, res) {
    if (req.body.hb.post)
        sendResponse(res, 200, jsonRes(true, req.body.hb.post))
    else
        sendResponse(res, 200, jsonRes(false, "no posts found"))
});