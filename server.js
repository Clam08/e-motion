var http = require('http');
var url = require('url');
const MongoClient = require('mongodb').MongoClient;
const mongo_url = "mongodb+srv://myao:myao@cluster0.3yzgg.mongodb.net/?retryWrites=true&w=majority";

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;


const users = []

async function verify_user_password(user_n, password) {
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');
    
    theQuery = {user:user_n}
    var items_found = await coll.find(theQuery).toArray();
    console.log(items_found[0].password)
    
    if(password == items_found[0].password){
      console.log("match")
      return "match";
    }
    return "no_match";
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
}

async function insert_users(user_n, password) {
    await MongoClient.connect(mongo_url, function(err, db) {
    console.log("connected");

    if (err) throw err;
  
    const dbo = db.db("emotion");
    var collection = dbo.collection('users');
    
    var newData = {"user": user_n, "password": password};
    collection.insertOne(newData, function(err, res) {
      if (err) throw err;
      console.log("new document inserted");
    });
    
    console.log("Success!");
    db.close();
  });
}

app.use(express.static('public'));

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "register.html" );
})
app.get('/login.html', function (req, res) {
   res.sendFile( __dirname + "/" + "login.html" );
})
app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})
app.get('/register.html', function (req, res) {
   res.sendFile( __dirname + "/" + "register.html" );
})


app.get('/process_get', async function (req, res) { //input user, take to login page
  var qobj = url.parse(req.url, true).query; //parse the query
  
  user_n = qobj.user_name;
  password = qobj.password; 
  await insert_users(user_n, password);
  
  res.redirect("http://localhost:3000/login.html" );
  res.end();
})

app.get('/process_login', async function (req, res) { //check users, take to main page
  var qobj = url.parse(req.url, true).query; //parse the query
  user_n = qobj.user_name;
  password = qobj.password; 
  
  result = await verify_user_password(user_n, password);
  console.log("result " + result)
  
  if (result == "match"){
    res.redirect( "http://localhost:3000/index.html" );
    res.end();
    return
  }  
  if (result == "no_match"){
    res.redirect( "http://localhost:3000/register.html" );
    res.end();
    return
  }
  res.end();
})

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})

