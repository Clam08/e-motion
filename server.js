var http = require('http');
var url = require('url');
var express = require('express');
const MongoClient = require('mongodb').MongoClient;
const mongo_url = "mongodb+srv://myao:myao@cluster0.3yzgg.mongodb.net/?retryWrites=true&w=majority";
var app = express();
var port = process.env.PORT || 3000;

const users = [];

async function verify_user_password(user_email, password) {
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');
    
    theQuery = {email:user_email}
    
    var items_found = await coll.find(theQuery).toArray();
    for (i=0; i<items_found.length; i++){
      if(password == items_found[i].password){
        console.log("match")
        user = {
          id: items_found[i]._id,
          email: items_found[i].email,
          name: items_found[i].user
        }
        users.push(user);
        return "match";
      }
    }
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
}

async function insert_users(user_n, user_email, password) {
    await MongoClient.connect(mongo_url, function(err, db) {
    if (err) throw err;
  
    const dbo = db.db("emotion");
    var collection = dbo.collection('users');
    
    var newData = {"user": user_n, "email": user_email, "password": password};
    collection.insertOne(newData, function(err, res) {
      if (err) throw err;
      console.log("new document inserted");
    });
    console.log("Success!");
    db.close();
  });
}

app.use(express.static('public'));

app.get('/process_get', async (req, res) => { //input user, take to login page
  var qobj = url.parse(req.url, true).query; //parse the query
  
  user_n = qobj.user_name;
  user_email = qobj.email;
  password = qobj.password; 
  await insert_users(user_n, user_email, password);
  
  res.redirect("/login.html" );
  res.end();
})

app.get('/process_login', async (req, res) => { //check users, take to main page
  var qobj = url.parse(req.url, true).query; //parse the query
  user_email = qobj.email;
  password = qobj.password; 
  
  result = await verify_user_password(user_email, password);
  console.log("result " + result)
  
  if (result == "match"){
    res.redirect( "index.html" );
  } else {
    res.redirect( "register.html" );
  }
  res.end();
})

app.get('/user', (req, res) => res.send(users[0]));

app.get('/blog', async (req, res) => {
  user_id = req.headers.email;
  console.log("user_id " + user_id);
  
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');
    
    theQuery = {email:user_id}
    
    var items_found = await coll.find(theQuery).toArray();
    
    res.send(items_found[0].entries);
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
});

app.get('/entry_get', async (req, res) => {
  var qobj = url.parse(req.url, true).query; //parse the query
  
  user_text = qobj.content;
  console.log("user_text " + user_text);
  
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');
    
    user_id = users[0].email;
    theQuery = {email:user_id}
    updateDocument = {
      $push: { "entries": user_text },
    };
    
    await coll.updateOne(theQuery, updateDocument);
    console.log("push success");
    res.redirect("index.html");
    
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
});

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

