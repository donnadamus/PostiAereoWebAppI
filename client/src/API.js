'use strict';

const SERVER_URL = 'http://localhost:3001/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {
                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))

                } else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj =>
                            reject(obj)
                        ) // error msg in the response body
                        .catch(err => reject({ error: "Cannot parse server response" })) // something else
                }
            })
            .catch(err =>
                reject({ error: "Cannot communicate" })
            ) // connection error
    });
}

function getJsonPOST(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {
                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))

                } else if (response.status === 409) {
                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))
                }
                else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj =>
                            reject(obj)
                        ) // error msg in the response body
                        .catch(err => reject({ error: "Cannot parse server response" })) // something else
                }
            }).catch(err =>
                reject({ error: "Cannot communicate" })
            ) // connection error
    });
}

const getAirplanesInfo = async () => {
    return getJson(
        fetch(SERVER_URL + 'airplanes')
    );
}

const getSeatsStatus = async (airplane_id) => {
    return getJson(
        fetch(SERVER_URL + `airplanes/${airplane_id}`)
    );
}

const getUserSeats = async (airplane_id) => {
    return getJson(
        fetch(SERVER_URL + `bookings/${airplane_id}`, { credentials: 'include' })
    );
}

const bookSeats = async (airplane_id, seatsToBook) => {
    return getJsonPOST(
        fetch(SERVER_URL + "bookings", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ airplane_id: airplane_id, seatsToBook: seatsToBook })
        })
    );
}

const deleteBooking = async (airplane_id) => {
    return getJson(
        fetch(SERVER_URL + "bookings/" + airplane_id, {
            method: 'DELETE',
            credentials: 'include'
        })
    )
}



/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
    return getJson(fetch(SERVER_URL + 'sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
        body: JSON.stringify(credentials),
    })
    )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        // this parameter specifies that authentication cookie must be forwared
        credentials: 'include'
    })
    )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        method: 'DELETE',
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
    })
    )
}

const API = { logIn, getUserInfo, logOut, getAirplanesInfo, getSeatsStatus, getUserSeats, bookSeats, deleteBooking };
export default API;


