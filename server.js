const express = require("express");
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3008

var apidb

var db

const app = express();

app.use(cookieParser());

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}))

app.use(express.static(path.join(__dirname, 'public')));

// main page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});

// display login page
app.get('/login', function(req, res){
	res.sendFile(path.join(__dirname + '/login.html'));
});

// display studio ghibli api
app.get('/api', function(req, res){
	res.send(apidb);
});

// register new account and insert into database
app.post('/register', function(req, res){
	var n = req.body.username
	var pw = req.body.password
	var person = {
		"user": n,
		"password": pw,
		"fv": []
	};
	db.collection('users').save(person, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/login')
  })
});

// check username and password
app.post('/login', function(req, res){
	var n = req.body.username
	var pw = req.body.password
	db.collection('users').find({"user": n, "password": pw}).toArray(function(err, results){
		if (results.length == 0){
		console.log("wrong password")
		res.redirect('/wpw')
		}
		else{
		res.cookie('User', n);
		res.redirect('/')
		}
	});

  });

// username or password not correct
app.get('/wpw', function(req, res){
	res.sendFile(path.join(__dirname + '/wpw.html'));
});

// log out page
app.get('/logout', function(req, res){
	res.clearCookie("User")
	res.redirect('/')
})

//get favourite
app.get('/favourite', function(req, res){
	user = req.cookies.User;
	db.collection('users').find({"user": user}, {"_id": 0, "fv": 1}).toArray(function(err, results){
		console.log(results[0].fv);
		res.render("fav", {fav: results});
	})

});

//add favourite
app.get('/favourite/:id', function(req, res){
	var user = req.cookies.User;
	var id = req.params.id
	var dire
	var name
	for (var i = apidb.length - 1; i >= 0; i--) {
		if (apidb[i].id == id){
			name = apidb[i].title
			dire = apidb[i].director
		}
	}
	console.log(name)
	console.log(dire)
	db.collection('users').find({"user": user}, {"_id": 0, "fv": 1}).toArray(function(err, results){
		console.log(results)
		var orifv = results[0].fv
		for (var i = orifv.length - 1; i >= 0; i--) {
			if (orifv[i].title == name){
				console.log("alreay exist")
				res.redirect("/")
				return
			}
		}
		orifv.push({"id": id, "title": name, "director": dire})
		console.log(orifv[0].title)
		db.collection('users').updateOne({"user": user}, {$set: {"fv": orifv}})
		res.redirect("/")	
	})

});

// delete favourite
app.post('/favourite/:index', (req, res) => {
 	var user = req.cookies.User;
	var key = req.params.index
	console.log(key)
	db.collection('users').find({"user": user}, {"_id": 0, "fv": 1}).toArray(function(err, results){
		var orifv = results[0].fv
		orifv.splice(key, 1)
		db.collection('users').updateOne({"user": user}, {$set: {"fv": orifv}})
		console.log("deleted")
		res.redirect("/favourite")
	})
});

request('https://ghibliapi.herokuapp.com/films', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body)
      // do more stuff
      apidb = info;
    }
 });

// set up datatbase
MongoClient.connect('mongodb://www:ddd@ds125906.mlab.com:25906/studioghibli', (err, database) => {
  if (err) return console.log(err)
  db = database
  console.log("database created");
  app.listen(3008, () => {
    console.log('listening on 3008')
  })
});
