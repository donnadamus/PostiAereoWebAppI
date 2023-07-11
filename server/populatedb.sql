BEGIN TRANSACTION;
DROP TABLE IF EXISTS "bookings";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "airplanes";

CREATE TABLE IF NOT EXISTS "airplanes" (
	"airplane_id" INTEGER,
	"type" TEXT NOT NULL,
	"totalrows" INTEGER NOT NULL,
	"totalcolumns" INTEGER NOT NULL,
	PRIMARY KEY ("airplane_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "users" (
	"id" INTEGER,
	"email" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"hash" TEXT NOT NULL,
	"salt" TEXT NOT NULL,
	PRIMARY KEY ("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "bookings" (
	"booking_id" INTEGER,
	"airplane_id" INTEGER NOT NULL,
	"user" INTEGER NOT NULL,
	"seatcode" TEXT NOT NULL,
	PRIMARY KEY ("booking_id" AUTOINCREMENT),
	FOREIGN KEY ("airplane_id") REFERENCES "airplanes" ("airplane_id"),
	FOREIGN KEY ("user") REFERENCES "users" ("id")
);
INSERT INTO "airplanes" ("airplane_id", "type", "totalrows", "totalcolumns") VALUES 
(1, 'Locale', 15, 4),
(2, 'Regionale', 20, 5),
(3, 'Internazionale', 25, 6);
INSERT INTO "users" ("id", "email", "name", "hash", "salt") VALUES
(1, "yesbooking1@gmail.com", "Marco Rossi", "e06a2f2073a3d66d1ca4fd6ce04c64fe684ea19c27660b05e2fbf7269ce9ff42","72e4eeb14def3b21"),
(2, "yesbooking2@gmail.com", "Gino Bianchi", "ac28edf49ba34ac83c17145375a030b4579ffddf3fe1dbb68f530bb3ca4ce514","a8b618c717683608"),
(3, "nobooking1@gmail.com", "Luca Neri", "4af3cc8549ccc19af11b711cada4509c4e93c57cca34078c683498ed7bf64258","e818f0647b4e1fe0"),
(4, "nobooking2@gmail.com", "Valerio Altobelli", "49631377fd41e0087a3eb1ff123ad2335c73a5407727b4c9f9c6877069b3670a","a818f0347d4e1fl0");
INSERT INTO "bookings" ("airplane_id", "user", "seatcode") VALUES
(1, 1, "3C"),
(1, 1, "3D"),
(1, 1, "5A"),
(1, 2, "11A"),
(1, 2, "11B"),
(2, 1, "18D"),
(2, 1, "18E"),
(2, 2, "14E"),
(2, 2, "14D");
COMMIT;

