import React, { useState, useContext, useEffect } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import MessageContext from '../messageCtx';
import { Seats } from './Seats';
import { ArrowClockwise } from 'react-bootstrap-icons';
import API from '../API';

const SeatTable = (props) => {

    const { seatData, bookedSeatsNumber, airplaneInfo, loggedIn, setDirty } = props;


    /* I calculate these at every re-render */

    const totalSeatsNumber = (airplaneInfo.totalrows * airplaneInfo.totalcolumns);
    const freeSeatsNumber = totalSeatsNumber - bookedSeatsNumber;

    const { handleErrors } = useContext(MessageContext);

    /* requestedSeats should not change between re-renders */

    const [requestedSeats, setRequestSeats] = useState([]);
    const [textRequestedSeats, setTextRequestedSeats] = useState('');
    /* following states are used to handle the error of seats already booked */
    const [alreadyTakenSeats, setAlreadyTakenSeats] = useState([]);
    const [buttonBlinking, setButtonBlinking] = useState(false);

    /* The following useEffect is usual in particular situations, one of those is 
    when I have some requestedSeats and the airplane seatData changes (for example 
        after I delete my booking). I need to make sure to remove from the requested
        seats the ones that are now not available anymore */

    /* I need the useEffect to handle the state which would persist
    through re-renders */

    /* basically to update the requestedSeats after I reload data from server */

    useEffect(() => {
        const init = async () => {
            try {
                const bookedSeats = seatData.filter(e => e.isBooked === true).map(e => e.seatNumber);
                setRequestSeats((requestedSeats) => {
                    const newRequestedSeats = requestedSeats.filter((e) => bookedSeats.includes(e) === false);
                    return [...newRequestedSeats];
                });
                setTextRequestedSeats('');
            } catch (err) {
                handleErrors(err);
            }
        };
        init();
    }, [seatData]);

    const handleSeatSelect = (selectedSeat) => {
        if (requestedSeats.includes(selectedSeat))
            setRequestSeats((requestedSeats) => {
                return requestedSeats.filter(e => e !== selectedSeat)
            })
        else
            setRequestSeats((requestedSeats) => [...requestedSeats, selectedSeat]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const requestedSeatNumber = Number(textRequestedSeats.trim());

        if (isNaN(requestedSeatNumber) || !Number.isInteger(requestedSeatNumber) || requestedSeatNumber <= 0)
            handleErrors({ error: "Inserisci un numero di posti valido" });
        else if (requestedSeatNumber > freeSeatsNumber)
            handleErrors({ error: "Non ci sono abbastanza posti disponibili" });
        else {
            /* seat selection */
            let tempRequestSeats = [];

            for (const seat of seatData) {
                if (seat.isBooked === false)
                    tempRequestSeats.push(seat.seatNumber);
                if (tempRequestSeats.length === requestedSeatNumber)
                    break;
            }


            setRequestSeats(tempRequestSeats);
        }
    }

    const deleteBooking = (airplane_id) => {
        API.deleteBooking(airplane_id)
            .then(() => { setDirty(true); })
            .catch(e => handleErrors(e));
    }

    const createBooking = async (airplane_id, seatsToBook) => {
        if (requestedSeats.length > 0) {
            try {
                const createBookingResult = await API.bookSeats(airplane_id, seatsToBook);
                setRequestSeats([]);
                if (createBookingResult.bookingSuccess === true)
                    setDirty(true);
                else if (createBookingResult.bookingSuccess === false) {
                    /* show the already taken seats by making the buttons blink */
                    setAlreadyTakenSeats(createBookingResult.seatsAlreadyTaken);
                    setButtonBlinking(true);
                    handleErrors({ error: 'Prenotazione fallita. Almeno uno dei posti richiesti è già occupato' });
                    setTimeout(() => {
                        setAlreadyTakenSeats([]);
                        setButtonBlinking(false);
                        setDirty(true);
                    }, 5000);  // Fetch correct version from server, after 5s
                }
            } catch (e) {
                handleErrors(e);
            }
        } else {
            handleErrors({ error: "Nessun posto richiesto, per favore seleziona i posti da prenotare" });
        }
    }

    return (
        <>
            <div className="d-flex flex-column">
                {
                    loggedIn &&
                    <Button
                        className="mb-2"
                        disabled={requestedSeats.length <= 0}
                        onClick={() => {
                            setRequestSeats([]);
                        }}
                    >
                        Cancella posti richiesti
                    </Button>
                }
                {
                    seatData.map(e => e.isUser).filter(e => e === true).length === 0 &&
                    loggedIn && requestedSeats.length > 0 &&
                    <Button
                        className="mb-2"
                        onClick={() => {
                            createBooking(airplaneInfo.airplane_id, requestedSeats);
                        }}
                    >
                        Prenota posti richiesti
                    </Button>

                }
            </div>
            <Container className="d-flex flex-column align-items-center">
                <h1>{airplaneInfo.type}</h1>
                <h2>{"Posti occupati: " + bookedSeatsNumber + " - Posti liberi: " + freeSeatsNumber + " - Posti totali: " + totalSeatsNumber}</h2>
                <h3>{(loggedIn && (" Posti richiesti: " + requestedSeats.length))}</h3>
                <Button variant="primary" className='mb-3'
                    onClick={() => {
                        setDirty(true);
                    }}
                >
                    <ArrowClockwise /> Refresh
                </Button>
                <Seats seatData={seatData} onSeatSelect={handleSeatSelect} numRows={airplaneInfo.totalrows}
                    numColumns={airplaneInfo.totalcolumns} loggedIn={loggedIn} requestedSeats={requestedSeats}
                    alreadyTakenSeats={alreadyTakenSeats} buttonBlinking={buttonBlinking}
                />
            </Container>
            <div>
                <div style={{ position: 'absolute', top: '6rem', right: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <Button variant='success' disabled={true}>Posto libero</Button>
                    <Button variant='danger' disabled={true}>Posto occupato</Button>
                    {loggedIn && <Button variant='warning' disabled={true}>Posto richiesto</Button>}
                    {loggedIn && <Button variant='primary' disabled={true}>Posto prenotato</Button>}
                </div>
                {
                    loggedIn && (
                        seatData.map(e => e.isUser).filter(e => e === true).length > 0
                            ?
                            <Button
                                onClick={() => {
                                    deleteBooking(airplaneInfo.airplane_id);
                                }}
                            >
                                Cancella Prenotazione
                            </Button>
                            :
                            <Form onSubmit={handleSubmit} className="d-flex flex-column align-items-center">
                                <Form.Group controlId="textRequestedSeats" className="d-flex flex-column align-items-center">
                                    <Form.Label>Inserisci numero posti da prenotare</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={textRequestedSeats}
                                        onChange={(ev) => setTextRequestedSeats(ev.target.value)}
                                    />
                                </Form.Group>
                                <Button
                                    type='submit'
                                    style={{ marginTop: '10px' }}
                                >
                                    Richiedi posti
                                </Button>
                            </Form>
                    )
                }
            </div>
        </>
    );
}

export { SeatTable };