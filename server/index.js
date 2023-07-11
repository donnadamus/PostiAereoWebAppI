'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const cors = require('cors');

const { check, validationResult } = require('express-validator'); // validation middleware
const airplanesDao = require('./dao-airplanes');
const userDao = require('./dao-users'); // module for accessing the user table in the DB

// init express
const app = new express();
const port = 3001;

app.use(morgan('dev'));
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "ghduishfdbsehyru",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
}


/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  let msgToReturn;

  if (param === 'seatsToBook')
    msgToReturn = 'Nessun posto richiesto';
  else if (param === 'airplane_id')
    msgToReturn = "ID Aereo non valido";
  else if (param === 'id')
    msgToReturn = "ID Aereo non valido";

  return msgToReturn;
};


/* ------------- Users APIs ------------- */

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({ message: "User logged out" });
  });
});


/* ------------- Airplanes APIs ------------- */

app.get('/api/airplanes',
  async (req, res) => {
    try {
      const airplanes = await airplanesDao.listAirplanes();
      res.json(airplanes);
    } catch {
      res.status(500).json({ errors: ["Database error"] });
    }
  }
);

app.get('/api/airplanes/:id',
  [check('id').isInt({ min: 1 })],    // check: is the id a positive integer?
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(errorFormatter); // format error message

      if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
      }

      const result = await airplanesDao.showSeatStatus(req.params.id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ errors: ["Database error"] });
    }
  }
);

app.get('/api/bookings/:airplane_id',
  isLoggedIn,
  [check('airplane_id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(errorFormatter); // format error message

      if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
      }

      const result = await airplanesDao.getUserSeats(req.user.id, req.params.airplane_id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ errors: ["Database error"] });
    }
  }
);

app.post('/api/bookings',
  isLoggedIn,
  [
    check('airplane_id').isInt({ min: 1 }),
    check('seatsToBook').isArray().isLength({ min: 1 })
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      const result = await airplanesDao.bookSeats(req.user.id, req.body.airplane_id
        , req.body.seatsToBook);
      if (result.error)
        res.status(404).json(result);
      else if (result.bookingSuccess === false && result.seatsAlreadyTaken.length > 0)
        res.status(409).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error: ${err}` });
    }
  }
);

app.delete('/api/bookings/:airplane_id',
  isLoggedIn,
  check('airplane_id').isInt({ min: 1 }),
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      const result = await airplanesDao.deleteBooking(req.user.id, req.params.airplane_id);
      if (result == null)
        return res.status(200).json({});
      else
        return res.status(404).json(result);
    } catch (err) {
      res.status(503).json({ error: 'Database error'});
    }
  }
);


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
