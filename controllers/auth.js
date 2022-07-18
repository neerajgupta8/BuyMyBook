const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { expressjwt: expressJwt } = require("express-jwt");
const { errorHandler } = require("../helpers/dbErrorHandler");
//..
//..

const JWT_SECRET = "jlakjhgkljagalkhgkvnkjsfn";

//signup
exports.signup = (req, res) => {
  console.log("req.body", req.body);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err),
      });
    }

    user.salt = undefined;
    user.hashed_password = undefined;

    res.json({
      user,
    });
  });
};
//..
//..

// signin
exports.signin = (req, res) => {
  //find the user based on email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup!",
      });
    }
    // if user is found make sure the email and password matched.
    // create authenticate method in user model
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and Password don't matched.",
      });
    }

    // generate a signed token with user id and secret
    const token = jwt.sign({ _id: user._id }, JWT_SECRET);

    //persist the token as 't' in cookie with expiry date
    res.cookie("t", token, { expire: new Date() + 9999 });

    //return response with user and token to frontend client.
    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, email, name, role } });
  });
};
//..
//..

//signout
exports.signout = (req, res) => {
  res.clearCookie("t");
  res.json({ message: "Signout Success" });
};
//..
//..

//requireSignin
exports.requireSignin = expressJwt({
  secret: JWT_SECRET,
  algorithms: ["HS256"],
  userProperty: "auth",
});
//..
//..

//To check if user is authorised
exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: "Access denied!",
    });
  }
  next();
};
//..
//..

//To check if Admin is there or not
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Admin resource! Access Denied",
    });
  }

  next();
};
