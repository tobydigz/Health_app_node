var fs = require('fs');
var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var admin = require("firebase-admin");
var serviceAccount = require('./json/adminsdk');
var loggedIn = true;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://healthapp-6945d.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("/reminders");

var port = process.env.PORT || 8080;

app.set('views', './views');
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('home', {
        title: 'Welcome'
    });
});

app.get('/login', function (req, res) {
    res.render('login',{
        title: 'Login'
    });
});

app.post('/login', function (req, res) {
    var userEmail = req.body.useremail;
    var userPassword = req.body.userpass;

    if(userEmail === 'doctor' && userPassword === '12345')loggedIn = true;
    return res.redirect('/send_message');
});

app.get('/send_message', function (req, res) {
    res.render('send_message',{
        title: 'Send Message'
    });
});

app.post('/send_message', function (req, res) {

    var title = req.body.title;
    var message = req.body.message;
    var sender = req.body.sender;
    writeMessagetoDb(message, title, sender);
    sendMessagetoTopic(title);
});

function writeMessagetoDb(message, title, sender) {
    ref.child("wfWMN7OlAVZz0jwhLSiKwCrVFqQ2").push({
        "title": title,
        "message": message,
        "sender": sender
    });
}

function sendMessagetoTopic(title) {
    var topic = "reminders_wfWMN7OlAVZz0jwhLSiKwCrVFqQ2";

    var payload = {
        message: title
    };

    admin.messaging().sendToTopic(topic, payload)
        .then(function (response) {
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        })
}

function isAuthenticated(req, res, next){

    return loggedIn;
}

function displayForm(res) {
    fs.readFile('./views/send_message.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
    });
}

app.listen(port);
