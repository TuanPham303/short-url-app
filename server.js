/* jshint esversion: 6 */

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

//bcrypt
const bcrypt = require('bcrypt');

//body parse the data from the user
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//cookie session
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['tuan'],
}));

app.set('view engine', 'ejs');

const urlDatabase = {};
let err = '';
let usedEmail;
const users = {};
//add all the variables to local by using middleware
app.use(function (req, res, next) {
  res.locals = {
    err: err,
    users: users,
    urls: urlDatabase,
    usedEmail: usedEmail,
    user_id: req.session.user_id,
  };
  next();
});

/////////////REGISTER//////////////
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', (req, res) => {
  //error handling
  if (req.body.email === '' || req.body.password === '') {
    err = true;
    res.redirect('/register');
  } else {
    let userId = generateRandomString(9);
    let hashedPassword;
    users[userId] = {};
    users[userId].id = userId;
    users[userId].email = req.body.email;
    hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[userId].password = hashedPassword;
    req.session.user_id = req.body.email;

    res.redirect('/urls');
  }
});

///////////LOGIN/////////////////
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', (req, res) => {
  for(let user in users){
    if(users[user].email === req.body.email){
      userId = users[user].id;
    }
  }
  let foundUser;
  for(let user in users){
    if(req.body.email === users[user].email && bcrypt.compareSync(req.body.password, users[user].password)){
        foundUser = true;
        break;
    } else {
      foundUser = false;
    }
  }
  if(!foundUser){
    res.render('login', {err: 'Not found, please enter correct email and password or register.'});
  } else {
    req.session.user_id = req.body.email;

    res.redirect('/urls');
  }
});
app.get('/urls', (req, res) => {
  let id = req.params.id;
  res.render('urls_index');
});

////////////LOG OUT///////////////
app.post('/logout', (request, response) => {
  request.session = null;

  response.redirect('/');
});

/////////////HOME PAGE/////////////
app.get('/', (request, response) => {
  response.render('urls_index');
});

//get user's input and update the urlDatabase
app.post("/urls/new", (request, response) => {
  let shortURL = generateRandomString(6);
  let d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  let date = d.getDate();
  let hour = d.getHours();
  let minute = d.getMinutes();
  let second = d.getSeconds();
  let createdTime = `${hour}:${minute}:${second} ${year}-${month + 1}-${date}`;
  urlDatabase[shortURL] = {};
  let userURL;
  if(request.body.longURL.indexOf('http://') === -1){
    userURL = request.body.longURL;
    userURL = 'http://' + userURL;
    urlDatabase[shortURL].longURL = userURL;
  } else {
    urlDatabase[shortURL].longURL = request.body.longURL;
  }
  urlDatabase[shortURL].owner = request.session.user_id;
  urlDatabase[shortURL].createdTime = createdTime;

  response.redirect('/urls');
});
app.get('/urls/new', (req, res) => {
  if(req.session.user_id === undefined){
    res.redirect('/login');
  } else {
    res.render('urls_new');
  }
});

//deleting url
app.post('/urls/:id/delete', (request, response) => {
  let id = request.params.id;
  delete urlDatabase[id];

  response.redirect('/');
});

//update url
app.get('/urls/:id', (req, res) => {
  let id = req.params.id;
  res.render('urls_show', {url: id});
});
app.post('/urls/:id/update', (request, response) => {
  let id = request.params.id;
  urlDatabase[id].longURL = request.body.longURL;
  let d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  let date = d.getDate();
  let hour = d.getHours();
  let minute = d.getMinutes();
  let second = d.getSeconds();
  let updatedTime = `${hour}:${minute}:${second} ${year}-${month + 1}-${date}`;
  urlDatabase[id].updatedTime = updatedTime;

  response.redirect(`/urls/${id}`);
});

//redirecting
app.get('/u/:id', (req, res) => {
  let id = req.params.id;
  res.redirect(`${urlDatabase[id].longURL}`);
});

function generateRandomString(length) {
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  let randomString = '';
  for (let i = 0; i < length; i++){
    let ranNumber = Math.floor(Math.random() * chars.length);
    randomString += chars.charAt(ranNumber);
  }
  return randomString;
}

//start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

