const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Schema = mongoose.Schema;

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const mongoDb = "mongodb+srv://admin:Qwe12138.@cluster0.ooifrfu.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
    "User",
    new Schema({
        username: {type: String, required: true},
        password: {type: String, required: true},
    })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({secret: "cats", resave: false, saveUninitialized: true}));

passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        };
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        };
        return done(null, user);
      } catch(err) {
        return done(err);
      };
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch(err) {
      done(err);
    };
  });



app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended:false}));
app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    next();
})

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});
app.post("/log-in", passport.authenticate("local", {successRedirect: "/",failureRedirect: "/"}));
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req,res,next) => {
    try{
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });
        const result = await user.save();
        res.redirect("/");
    }catch(err){
        return next(err);
    };
});
app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.listen(3000, () => console.log("app listening on port 3000!"));