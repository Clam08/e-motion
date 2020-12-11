var http = require('http');
var url = require('url');
var express = require('express');
const MongoClient = require('mongodb').MongoClient;
const mongo_url = "mongodb+srv://myao:myao@cluster0.3yzgg.mongodb.net/?retryWrites=true&w=majority";
var app = express();
var port = process.env.PORT || 3000;

const users = [];

async function verify_user_password(user_n, password) {
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');
    
    theQuery = {user:user_n}
    var items_found = await coll.find(theQuery).toArray();
    
    for (i=0; i<items_found.length; i++){
      if(password == items_found[i].password){
        console.log("match")
        user = {
          id: items_found[i]._id,
          name: items_found[i].user
        }
        users.push(user);
        return user;
      }
    }
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
}

async function insert_users(user_n, password) {
    await MongoClient.connect(mongo_url, function(err, db) {
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

app.get('/process_get', async (req, res) => { //input user, take to login page
  var qobj = url.parse(req.url, true).query; //parse the query
  
  user_n = qobj.user_name;
  password = qobj.password; 
  await insert_users(user_n, password);
  
  res.redirect("/login.html" );
  res.end();
})

app.get("/random", (req, res) => {
  res.status(200).json({message: "what is the matter"});
})

app.get('/process_login', async (req, res) => { //check users, take to main page
  var qobj = url.parse(req.url, true).query; //parse the query
  user_n = qobj.user_name;
  password = qobj.password; 
  
  result = await verify_user_password(user_n, password);
  console.log("result " + result)
  
  if (result != ""){
    res.redirect('/index.html')
  }  else {
    res.redirect( "register.html" );
  }
  res.end();
})

app.get('/user', (req, res) => res.send(users[0]));

app.post('/blog', (req, res) => {
  res.send({message:"helldfadfadfdo"})
});

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

