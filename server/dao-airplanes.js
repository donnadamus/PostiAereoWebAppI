'use strict';

/* Data Access Object (DAO) module for accessing airplanes data */

const db = require('./db');

/**
 * Wrapper around db.all
 */
const dbAllAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

/**
 * Wrapper around db.run
 */
const dbRunAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, err => {
    if (err) reject(err);
    else resolve();
  });
});

/**
 * Wrapper around db.get
 */
const dbGetAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// This function retrieves the whole list of airplanes + the total seats taken from the database (not auth).
exports.listAirplanes = async () => {
  const sql = 'SELECT a.*, COALESCE(b.totaltaken, 0) AS totaltaken FROM airplanes a LEFT JOIN (SELECT airplane_id, COUNT(*) AS totaltaken FROM bookings GROUP BY airplane_id) b ON a.airplane_id = b.airplane_id';
  const airplanes = await dbAllAsync(db, sql, []);
  return airplanes;
};

// This function retrieves info and seat status for a given airplane (not auth).
exports.showSeatStatus = async (airplane_id) => {

  const sql_airplaneInfo = 'SELECT * FROM airplanes WHERE airplane_id=?';
  const sql_getBookings = 'SELECT booking_id, airplane_id, seatcode FROM bookings WHERE airplane_id=?';
  const airplaneInfo = await dbGetAsync(db, sql_airplaneInfo, [airplane_id]);

  if (!airplaneInfo)
    return { error: "Aereo non esistente" };

  const bookedSeats = await dbAllAsync(db, sql_getBookings, [airplaneInfo.airplane_id]);

  return { airplaneInfo, bookedSeats };

};

exports.getUserSeats = async (user_id, airplane_id) => {

  /* check if airplane_id exists */
  const sql_airplaneInfo = 'SELECT * FROM airplanes WHERE airplane_id=?';
  const airplaneInfo = await dbGetAsync(db, sql_airplaneInfo, [airplane_id]);

  if (!airplaneInfo)
    return { error: "Aereo non esistente" };


  const sql_getBookings = 'SELECT * FROM bookings WHERE user=? AND airplane_id=?';
  const bookings = await dbAllAsync(db, sql_getBookings, [user_id, airplane_id]);

  return bookings;
};

/* helper function for bookSeats, checks if the code sent by the client
  is a valid code for that airplane */

function isValidFormat(str, maxNumber, maxLetter) {
  let numberPart = str.slice(0, -1);
  let lastChar = str.slice(-1);

  // Check if numberPart is a valid number
  let number = parseInt(numberPart);
  if (isNaN(number)) {
    return false;
  }

  // Check if lastChar is a letter
  if (!/[A-Z]/.test(lastChar)) {
    return false;
  }

  let maxLetterChar = String.fromCharCode('A'.charCodeAt(0) + maxLetter - 1);
  let lastCharUpperCase = lastChar.charCodeAt(0);

  return number >= 1 && number <= maxNumber && lastCharUpperCase <= maxLetterChar.charCodeAt(0);
}

/* returns an object
  first field is bookingSuccess = {false, true}
  second field is seatsAlreadyTaken = [] or error
*/

exports.bookSeats = async (user_id, airplane_id, seatsReadyToBook) => {

  let tempAlreadyTaken = [];

  let seatsToBook = seatsReadyToBook.map(e => e.toUpperCase());

  /* check if airplane_id exists */
  const sql_airplaneInfo = 'SELECT * FROM airplanes WHERE airplane_id=?';
  const airplaneInfo = await dbGetAsync(db, sql_airplaneInfo, [airplane_id]);

  if (!airplaneInfo)
    return { error: "Aereo non esistente" };

  /* It's not necessary to check if there's enough availability of seats,
    since if there's not it means that at least one of the requestedSeats is 
    already taken, and that will make the booking fail anyway */

  /* check that the user does not have booked seats already */

  const userSeats = await this.getUserSeats(user_id, airplane_id);

  if (userSeats.length !== 0)
    return { error: "E' già presente una prenotazione" };

  /* check that the seats are valid for the given airplane_id */

  const airplane = (await this.showSeatStatus(airplane_id)).airplaneInfo;

  const isValidFormatForAll = seatsToBook.every(str =>
    isValidFormat(str, airplane.totalrows, airplane.totalcolumns));

  if (isValidFormatForAll === false)
    return { error: "Codice posto non valido" };

  /* check that every single seat in seatsToBook is not taken */

  const seatCodeAlreadyBooked = (await this.showSeatStatus(airplane_id)).bookedSeats.map(
    (e) => e.seatcode
  );

  for (let seat of seatsToBook) {
    if (seatCodeAlreadyBooked.includes(seat))
      tempAlreadyTaken.push(seat);
  }

  if (tempAlreadyTaken.length !== 0)
    return { bookingSuccess: false, seatsAlreadyTaken: tempAlreadyTaken };

  /* I can now proceed to book the seats */

  const sql = 'INSERT INTO bookings (airplane_id, user, seatcode) VALUES(?, ?, ?)';

  for (let seat of seatsToBook) {
    await dbRunAsync(db, sql, [airplane_id, user_id, seat]);
  }

  return { bookingSuccess: true, seatsAlreadyTaken: [] };

};

exports.deleteBooking = async (user_id, airplane_id) => {

  /* check if airplane_id exists */
  const sql_airplaneInfo = 'SELECT * FROM airplanes WHERE airplane_id=?';
  const airplaneInfo = await dbGetAsync(db, sql_airplaneInfo, [airplane_id]);

  if (!airplaneInfo)
    return { error: "Aereo non esistente" };

  const sql = 'DELETE FROM bookings WHERE user=? AND airplane_id=?';
  const result = await dbRunAsync(db, sql, [user_id, airplane_id]);
  return result;
}


