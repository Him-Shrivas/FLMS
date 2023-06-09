var express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  expressvalidator = require("express-validator"),
  session = require("express-session"),
  methodOverride = require("method-override"),
  bodyparser = require("body-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  passportLocalMongoose = require("passport-local-mongoose"),
  flash = require("connect-flash"),
  Faculty = require("./models/faculty"),
  Principal = require("./models/principal"),
  Hod = require("./models/hod"),
  Leave = require("./models/leave");
require('dotenv').config;
var moment = require("moment");
const multer = require('multer');

var url = process.env.DATABASEURL || "mongodb+srv://root:root@cluster0.einlbbo.mongodb.net/test";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("connected to DB");
  })
  .catch(err => {
    console.log("Error:", err.message);
  });

app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(expressvalidator());

//passport config
app.use(
  require("express-session")({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());


// multer

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    var filename = Date.now() + Math.floor(Math.random() * 1000000) + file.originalname;
    cb(null, filename)

  }
})
// for file filtering 
function fileFilter(req, file, cb) {

  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp') {
    cb(null, true)
  } else {
    cb(new Error('Bhai tejj mt chal ....'));
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter })

/* GET home page. */
// FOR PROFILE PHOTO UPLOAD
// profile ROUTE RENDERING
app.get('/profile', function (req, res) {
  res.render('profile');
});
app.post('/image', upload.single('image'), function (req, res) {
  Hod.findOne({ id: req.params.id })
    .then(function (user2) {
      user2.image = req.file.filename;
      user2.save()
        .then(function () {
          res.redirect('back');
        })
    })
});

app.get('/facimage', function (req, res) {
  res.render('profilefac');
});

app.post('/facimage', upload.single('image'), function (req, res) {
  Faculty.findOne({ id: req.params.id })
    .then(function (user2) {
      user2.image = req.file.filename;
      user2.save()
        .then(function () {
          res.redirect("/faculty/home");
        })
    })
});

app.get('/priimage', function (req, res) {
  res.render('profilepicprincipal');
});

app.post('/priimage', upload.single('image'), function (req, res) {
  Principal.findOne({ id: req.params.id })
    .then(function (user3) {
      user3.image = req.file.filename;
      user3.save()
        .then(function () {
          res.redirect("/principal/home")
        })
    })
});


// passport.use(new LocalStrategy(Faculty.authenticate()));
// passport.use(
//   new LocalStrategy(function(username, password, done) {
//     User.findOne({ username: username }, function(err, user) {
//       if (err) {
//         return done(err);
//       }
//       if (!user) {
//         return done(null, false);
//       }
//       if (!user.verifyPassword(password)) {
//         return done(null, false);
//       }
//       return done(null, user);
//     });
//   })
// );

// passport.serializeUser(Faculty.serializeUser());
// passport.deserializeUser(Faculty.deserializeUser());
// app.use(
//   expressvalidator({
//     errorFormatter: function(param, msg, value) {
//       var namespace = param.split("."),
//         root = namespace.shift(),
//         formParam = root;

//       while (namespace.length) {
//         formParam += "[" + namespace.shift() + "]";
//       }
//       return {
//         param: formParam,
//         msg: msg,
//         value: value
//       };
//     }
//   })
// );
app.use(flash());
app.use((req, res, next) => {
  //   res.locals.currentUser = req.user;
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.user = req.user || null;
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash("error", "You need to be logged in");
    res.redirect("/faculty/login");
  }
}
app.get("/", (req, res) => {
  res.render("home");
});


app.get("/admin", (req, res) => {
  res.render("admin")
});
//login logic for Faculty
//login logic for Hod
// passport.serializeUser(function(hod, done) {
//   done(null, hod.id);
// });

// passport.deserializeUser(function(id, done) {

// });

//registration form
app.get("/register", (req, res) => {
  res.render("register");
});
//registration logic
app.post("/faculty/register", (req, res) => {
  var type = req.body.type;
  if (type == "faculty") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var department = req.body.department;

    // var image = req.body.image;
    //validation
    req.checkBody("name", "name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("department", "department is required").notEmpty();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      // req.session.errors = errors;
      // req.session.success = false;
      console.log("errors: " + errors);
      res.render("register", {
        errors: errors
      });
    } else {
      var newFaculty = new Faculty({
        name: name,
        username: username,
        password: password,
        department: department,

        type: type,
        // image: image
      });
      Faculty.createFaculty(newFaculty, (err, faculty) => {
        if (err) {
          if (err.code === 11000) { // This code indicates a duplicate key error
            req.flash('error', 'Username already taken');
            res.redirect('/faculty/register');
          } else {
            throw err;
          }
        } else {
          req.flash("success", "you are registered successfully,now you can login");
          res.redirect("/faculty/login");
        }
      });    
    }
  } else if (type == "hod") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var department = req.body.department;
    // var image = req.body.image;

    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("password", "password is required").notEmpty();
    req.checkBody("department", "department is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      res.render("register", {
        errors: errors
      });
    } else {
      var newHod = new Hod({
        name: name,
        username: username,
        password: password,
        department: department,
        type: type,
        // image: image
      });
      Hod.createHod(newHod, (err, hod) => {
        if (err) {
          if (err.code === 11000) { // This code indicates a duplicate key error
            req.flash('error', 'Username already taken');
            res.redirect('/hod/register');
          } else {
            throw err;
          }
        } else {
          req.flash("success", "you are registered successfully,now you can login");
          res.redirect("/hod/login");
        }
      });
    }
  } else if (type == "principal") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    // var image = req.body.image;

    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("password", "password is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      res.render("register", {
        errors: errors
      });
    } else {
      var newPrincipal = new Principal({
        name: name,
        username: username,
        password: password,

        type: type,
       // image: image
      });
      Principal.createPrincipal(newPrincipal, (err, principal) => {
        if (err) {
          if (err.code === 11000) { // This code indicates a duplicate key error
            req.flash('error', 'Username already taken');
            res.redirect('/principal/register');
          } else {
            throw err;
          }
        } else {
          req.flash("success", "you are registered successfully,now you can login");
          res.redirect("/principal/login");
        }
      });
    }
  }
});

//stratergies
passport.use(
  "faculty",
  new LocalStrategy((username, password, done) => {
    Faculty.getUserByUsername(username, (err, faculty) => {
      if (err) throw err;
      if (!faculty) {
        return done(null, false, { message: "Unknown User" });
      }
      Faculty.comparePassword(
        password,
        faculty.password,
        (err, passwordFound) => {
          if (err) throw err;
          if (passwordFound) {
            return done(null, faculty);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        }
      );
    });
  })
);

passport.use(
  "hod",
  new LocalStrategy((username, password, done) => {
    Hod.getUserByUsername(username, (err, hod) => {
      if (err) throw err;
      if (!hod) {
        return done(null, false, { message: "Unknown User" });
      }
      Hod.comparePassword(password, hod.password, (err, passwordFound) => {
        if (err) throw err;
        if (passwordFound) {
          return done(null, hod);
        } else {
          return done(null, false, { message: "Invalid Password" });
        }
      });
    });
  })
);

passport.use(
  "principal",
  new LocalStrategy((username, password, done) => {
    Principal.getUserByUsername(username, (err, principal) => {
      if (err) throw err;
      if (!principal) {
        return done(null, false, { message: "Unknown User" });
      }
      Principal.comparePassword(
        password,
        principal.password,
        (err, passwordFound) => {
          if (err) throw err;
          if (passwordFound) {
            return done(null, principal);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        }
      );
    });
  })
);

//serialize

passport.serializeUser(function (user, done) {
  // console.log(user.id);
  done(null, { id: user.id, type: user.type });
});

//deserialize

passport.deserializeUser(function (obj, done) {
  switch (obj.type) {
    case "faculty":
      Faculty.getUserById(obj.id, function (err, faculty) {
        done(err, faculty);
      });
      break;
    case "hod":
      Hod.getUserById(obj.id, function (err, hod) {
        done(err, hod);
      });
      break;
    case "principal":
      Principal.getUserById(obj.id, function (err, principal) {
        done(err, principal);
      });
      break;
    default:
      done(new Error("no entity type:", obj.type), null);
      break;
  }
});

app.get("/faculty/login", (req, res) => {
  res.render("login");
});

app.post(
  "/faculty/login",
  passport.authenticate("faculty", {
    successRedirect: "/faculty/home",
    failureRedirect: "/faculty/login",
    failureFlash: true
  }),
  (req, res) => {
    // console.log(faculty);
    res.redirect("/faculty/home");
  }
);

app.get("/faculty/home", ensureAuthenticated, (req, res) => {
  var faculty = req.user.username;
  console.log(faculty);
  Faculty.findOne({ username: req.user.username })
    .populate("leaves")
    .exec((err, faculty) => {
      if (err || !faculty) {
        req.flash("error", "faculty not found");
        res.redirect("back");
        console.log("err");
      } else {
        res.render("homestud", {
          faculty: faculty,
          moment: moment
        });
      }
    });
});
app.get("/faculty/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Faculty.findById(req.params.id)
    .populate("leaves")
    .exec((err, foundFaculty) => {
      if (err || !foundFaculty) {
        req.flash("error", "Faculty not found");
        res.redirect("back");
      } else {
        res.render("profilestud", { faculty: foundFaculty });
      }
    });
});
app.get("/faculty/:id/edit", ensureAuthenticated, (req, res) => {
  Faculty.findById(req.params.id, (err, foundFaculty) => {
    res.render("editF", { faculty: foundFaculty });
  });
});
app.put("/faculty/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.faculty);
  Faculty.findByIdAndUpdate(
    req.params.id,
    req.body.faculty,
    (err, updatedFaculty) => {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        req.flash("success", "Succesfully updated");
        res.redirect("/faculty/" + req.params.id);
      }
    }
  );
});

app.get("/faculty/:id/apply", ensureAuthenticated, (req, res) => {
  Faculty.findById(req.params.id, (err, foundStud) => {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      res.render("leaveApply", { faculty: foundStud });
    }
  });
});
app.post("/faculty/:id/apply", (req, res) => {
  Faculty.findById(req.params.id)
    .populate("leaves")
    .exec((err, faculty) => {
      if (err) {
        res.redirect("/faculty/home");
      } else {
        date = new Date(req.body.leave.from);
        todate = new Date(req.body.leave.to);
        today = new Date();

        // check if date is in the past
        if (date < today) {
          req.flash("error", "Leave date cannot be in the past");
          res.redirect("back");
          return;
        }
        year = date.getFullYear();
        month = date.getMonth() + 1;
        dt = date.getDate();
        todt = todate.getDate()+1;
        if (dt < 10) {
          dt = "0" + dt;
        }
        if (month < 10) {
          month = "0" + month;
        }
        console.log(todt - dt);
        req.body.leave.days = todt - dt;
        console.log(year + "-" + month + "-" + dt);
        // req.body.leave.to = req.body.leave.to.substring(0, 10);
        console.log(req.body.leave);
        // var from = new Date(req.body.leave.from);
        // from.toISOString().substring(0, 10);
        // console.log("from date:", strDate);
        switch (req.body.leave.type) {
          case "od":
            faculty.leaveCounts.od -= req.body.leave.days;
            break;
          case "el":
            faculty.leaveCounts.el -= req.body.leave.days;
            break;
          case "ml":
            faculty.leaveCounts.ml -= req.body.leave.days;
            break;
          case "cl":
            faculty.leaveCounts.cl -= req.body.leave.days;
            break;
          default:
            break;
        }
        Leave.create(req.body.leave, (err, newLeave) => {
          if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("back");
            console.log(err);
          } else {
            newLeave.stud.id = req.user._id;
            newLeave.stud.username = req.user.username;
            console.log("leave is applied by--" + req.user.username);
            // console.log(newLeave.from);
            newLeave.save();
            faculty.leaves.push(newLeave);
            faculty.save();
            req.flash("success", "Successfully applied for leave");
            res.render("homestud", { faculty: faculty, moment: moment });
          }
        });
      }
    });
});

app.get("/faculty/:id/track", (req, res) => {
  Faculty.findById(req.params.id)
    .populate("leaves")
    .exec((err, foundStud) => {
      if (err) {
        req.flash("error", "No faculty with requested id");
        res.redirect("back");
      } else {

        res.render("trackLeave", { faculty: foundStud, moment: moment });
      }
    });
});
app.get("/hod/login", (req, res) => {
  res.render("hodlogin");
});

app.get("/about", (req, res) => {
  res.render("about");
});


app.post(
  "/hod/login",
  passport.authenticate("hod", {
    successRedirect: "/hod/home",
    failureRedirect: "/hod/login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/hod/home");
  }
);
app.get("/hod/home", ensureAuthenticated, (req, res) => {
  Hod.find({}, (err, hod) => {
    if (err) {
      console.log("err");
    } else {
      res.render("homehod", {
        hod: req.user
      });
    }
  });
});
app.get("/hod/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Hod.findById(req.params.id).exec((err, foundHod) => {
    if (err || !foundHod) {
      req.flash("error", "Hod not found");
      res.redirect("back");
    } else {
      res.render("profilehod", { hod: foundHod });
    }
  });
});
app.get("/hod/:id/edit", ensureAuthenticated, (req, res) => {
  Hod.findById(req.params.id, (err, foundHod) => {
    res.render("editH", { hod: foundHod });
  });
});
app.put("/hod/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.hod);
  Hod.findByIdAndUpdate(req.params.id, req.body.hod, (err, updatedHod) => {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      req.flash("success", "Succesfully updated");
      res.redirect("/hod/" + req.params.id);
    }
  });
});
app.get("/hod/:id/leave", (req, res) => {
  Hod.findById(req.params.id).exec((err, hodFound) => {
    if (err) {
      req.flash("error", "hod not found with requested id");
      res.redirect("back");
    } else {
      // console.log(hodFound);
      Faculty.find({ department: hodFound.department })
        .populate("leaves")
        .exec((err, facultys) => {
          if (err) {
            req.flash("error", "faculty not found with your department");
            res.redirect("back");
          } else {
            // facultys.forEach(function(faculty) {
            //   if (faculty.leaves.length > 0) {
            // faculty.leaves.forEach(function(leave) {
            //   console.log(leave);
            //   console.log("////////////");
            // Leave.findById(leave, (err, leaveFound) => {
            //   if (err) {
            //     req.flash("error", "leave not found");
            //     res.redirect("back");
            //   } else {
            //     // console.log(leaveFound.subject);
            res.render("hodLeaveSign", {
              hod: hodFound,
              facultys: facultys,
              // leave: leaveFound,
              moment: moment
            });
            //   }
            // });
            // });
            // }
            // Leave.find({ username: faculty.username }, (err, leave) => {
            //   console.log(leave.username);
            // });
            // });
            // console.log(facultys);
          }
        });
    }
    // console.log(req.body.hod);
  });
});

app.get("/hod/:id/leave/:stud_id/info", (req, res) => {
  Hod.findById(req.params.id).exec((err, hodFound) => {
    if (err) {
      req.flash("error", "hod not found with requested id");
      res.redirect("back");
    } else {
      Faculty.findById(req.params.stud_id)
        .populate("leaves")
        .exec((err, foundFaculty) => {
          if (err) {
            req.flash("error", "faculty not found with this id");
            res.redirect("back");
          } else {
            res.render("moreinfostud", {
              faculty: foundFaculty,
              hod: hodFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.post("/hod/:id/leave/:stud_id/info", (req, res) => {
  Hod.findById(req.params.id).exec((err, hodFound) => {
    if (err) {
      req.flash("error", "hod not found with requested id");
      res.redirect("back");
    } else {
      Faculty.findById(req.params.stud_id)
        .populate("leaves")
        .exec((err, foundFaculty) => {
          if (err) {
            req.flash("error", "faculty not found with this id");
            res.redirect("back");
          } else {
            if (req.body.action === "Approve") {
              foundFaculty.leaves.forEach(function (leave) {
                if (leave.status === "pending") {
                  leave.status = "approved";
                  leave.approved = true;
                  leave.save();
                }
              });
            } else {
              console.log("u denied");
              foundFaculty.leaves.forEach(function (leave) {
                if (leave.status === "pending") {
                  leave.status = "denied";
                  leave.denied = true;
                  leave.save();
                }
              });
            }
            res.render("moreinfostud", {
              faculty: foundFaculty,
              hod: hodFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.get("/principal/login", (req, res) => {
  res.render("principallogin");
});

app.post(
  "/principal/login",
  passport.authenticate("principal", {
    successRedirect: "/principal/home",
    failureRedirect: "/principal/login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/principal/home");
  }
);
app.get("/principal/home", ensureAuthenticated, (req, res) => {
  Principal.find({}, (err, hod) => {
    if (err) {
      console.log("err");
    } else {
      res.render("homeprincipal", {
        principal: req.user
      });
    }
  });
});

app.get("/principal/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Principal.findById(req.params.id).exec((err, foundPrincipal) => {
    if (err || !foundPrincipal) {
      req.flash("error", "Principal not found");
      res.redirect("back");
    } else {
      res.render("profileprincipal", { principal: foundPrincipal });
    }
  });
});
app.get("/principal/:id/edit", ensureAuthenticated, (req, res) => {
  Principal.findById(req.params.id, (err, foundPrincipal) => {
    res.render("editP", { principal: foundPrincipal });
  });
});

app.put("/principal/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.principal);
  Principal.findByIdAndUpdate(
    req.params.id,
    req.body.principal,
    (err, updatedPrincipal) => {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        req.flash("success", "Succesfully updated");
        res.redirect("/principal/" + req.params.id);
      }
    }
  );
});

app.get("/principal/:id/leave", (req, res) => {
  Principal.findById(req.params.id).exec((err, principalFound) => {
    if (err) {
      req.flash("error", "hod not found with requested id");
      res.redirect("back");
    } else {
      // console.log(hodFound);
      Faculty.find()
        .populate("leaves")
        .exec((err, facultys) => {
          if (err) {
            req.flash("error", "faculty not found with your department");
            res.redirect("back");
          } else {
            res.render("principalLeaveSign", {
              principal: principalFound,
              facultys: facultys,

              moment: moment
            });
          }
        });
    }
  });
});
app.get("/principal/:id/leave/:stud_id/info", (req, res) => {
  Principal.findById(req.params.id).exec((err, principalFound) => {
    if (err) {
      req.flash("error", "principal not found with requested id");
      res.redirect("back");
    } else {
      Faculty.findById(req.params.stud_id)
        .populate("leaves")
        .exec((err, foundFaculty) => {
          if (err) {
            req.flash("error", "faculty not found with this id");
            res.redirect("back");
          } else {
            res.render("Principalmoreinfostud", {
              faculty: foundFaculty,
              principal: principalFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.post("/principal/:id/leave/:stud_id/info", (req, res) => {
  Principal.findById(req.params.id).exec((err, principalFound) => {
    if (err) {
      req.flash("error", "principal not found with requested id");
      res.redirect("back");
    } else {
      Faculty.findById(req.params.stud_id)
        .populate("leaves")
        .exec((err, foundFaculty) => {
          if (err) {
            req.flash("error", "faculty not found with this id");
            res.redirect("back");
          } else {
            //TODO: Fix this error get id with approve req and findById and update leave.principalstatus = "approved" do not use forEach
            if (req.body.action === "Approve") {
              foundFaculty.leaves.forEach(function (leave) {
                if (leave.principalstatus === "pending") {
                  leave.principalstatus = "approved";
                  leave.save();
                }
              });
            } else {
              console.log("u denied");
              foundFaculty.leaves.forEach(function (leave) {
                if (leave.principalstatus === "pending") {
                  leave.principalstatus = "denied";

                  leave.save();
                }
              });
            }
            res.render("Principalmoreinfostud", {
              faculty: foundFaculty,
              principal: principalFound,
              moment: moment
            });
          }
        });
    }
  });
});

//logout for faculty

app.get("/logout", (req, res) => {
  req.logout();
  // req.flash("success", "you are logged out");
  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});