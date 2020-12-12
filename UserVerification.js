const user_verfication = (req, res, next) => {
  const auth_token = req.headers["authorization"];
  if(!auth_token){
    return res.sendStatus(401);
    console.log("auth_token not found");
  }
  try{
    req.user_id = auth_token;
    console.log("token added to header");
    next();
  }
  catch(err){
    req.sendStatus(403);
  }
}

module.exports = user_verfication;