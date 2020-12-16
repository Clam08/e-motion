var http = require('http');
var url = require('url');
var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var verifyToken = require('./UserVerification.js');

const mongo_url = "mongodb+srv://myao:myao@cluster0.3yzgg.mongodb.net/?retryWrites=true&w=majority";
var app = express();
var port = process.env.PORT || 3000;

function hashCode(password){
    var hash = 0;
    if (password.length == 0) return hash;
    for (i = 0; i < password.length; i++){
        char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    console.log(hash)
    return hash;
}

app.use(express.json());
app.use(express.static('public'));

app.post('/login', async (req, res) => {
  user_email = req.body.email;
  password = req.body.password;
  password_hashed = hashCode(password);

  const client = await MongoClient.connect(mongo_url);
  console.log("MongoClient connect");
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');

    theQuery = {email:user_email}
    console.log("theQuery " + user_email);

    var items_found = await coll.findOne(theQuery);
    if (!items_found){
      console.log("user not found");
      return res.status(400).json({message: "user not found"});
    }

    if(password_hashed != items_found.password){
      return res.status(400).json({message: "password not match"});
    }
    console.log("success  match");
    return res.status(200).json({message: "success", id: items_found._id});
  } catch (err) {
      console.log(err);
  } finally {
    client.close();
  }
})

app.post('/register', async (req, res) => {
  user_name = req.body.user;
  user_email = req.body.email;
  password = req.body.password;
  password_hashed = hashCode(password);

  const client = await MongoClient.connect(mongo_url);
  console.log("MongoClient connect");
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');

    theQuery = {email:user_email}
    console.log("theQuery " + user_email);

    var items_found = await coll.findOne(theQuery);
    if (items_found){
      console.log("user already exist!");
      return res.status(400).json({message: "user already exist"});
    }

    var newData = {"user": user_name, "email": user_email, "password": password_hashed};
    coll.insertOne(newData, function(err, res) {
      if (err) throw err;
      console.log("new document inserted");
    });
    console.log("Success!");
    return res.status(200).json({message: "success"});

  } catch (err) {
      console.log(err);
  } finally {
    client.close();
  }
})

app.get('/blog', verifyToken, async (req, res) => {
  console.log("user_id in get-blog " + req.user_id);
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');

    theQuery = { "_id" : ObjectId(req.user_id)}

    console.log("before items_found" );
    var items_found = await coll.findOne(theQuery);
    if (!items_found){
      return res.status(400).json({message: "item not found"});
    }
    console.log("items_found " + items_found);

    res.status(200).send(items_found);
    // return res.status(200).json({message: "success"});

  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
});


app.post('/entry_add', verifyToken, async (req, res) => {
  user_text = req.body.entry;
  user_date = req.body.date;
  user_score = req.body.score;

  console.log("entry_add " + req.user_id);
  const client = await MongoClient.connect(mongo_url)
  try {
    const dbo = client.db("emotion");
    var coll = dbo.collection('users');

    theQuery = { "_id" : ObjectId(req.user_id)}
    updateDocument = {
      $push: { "entries": {"entry": user_text, "date": user_date, "score": user_score} },
    };
    await coll.updateOne(theQuery, updateDocument);
    console.log("push success");

    return res.status(200).json({message: "success"});
  } catch (err) {
      console.log(err);
  } finally {
      client.close();
  }
})


var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})


