import { React, useContext, useState, useEffect } from 'react';
import { Row, Col, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { SeatTable } from './SeatTable';

import MessageContext from '../messageCtx';
import API from '../API';
import { LoginForm } from './Auth';
import { AirplaneCard } from './AirplaneCard';


function ViewSeatLayout(props) {

    const { loggedIn, dirty, setDirty, setLoadAirplaneInfo } = props;

    const { handleErrors } = useContext(MessageContext);

    const { airplane_id } = useParams();

    /* I also had the option to pass the airplaneInfo as a prop from App.jsx,
        but since I designed the API so that it would also return the data about the airplane,
        I decided to go with the latter option */
    const [airplaneInfo, setAirplaneInfo] = useState();
    const [airplaneBookedSeats, setairplaneBookedSeats] = useState([]);
    const [seatData, setSeatData] = useState([]);

    const generateSeatData = (bookedSeats, userSeats, totalrows, totalcolumns) => {
        /* generate seatData */

        let seatData = [];

        const startCharCode = 'A'.charCodeAt(0); // Get the Unicode value of 'A'

        const bookedSeatCodes = bookedSeats.map(e => e.seatcode);
        const userSeatCodes = userSeats.map(e => e.seatcode);

        for (let i = 1; i < totalrows + 1; i++) {
            for (let j = 0; j < totalcolumns; j++) {
                const seatNumber = i.toString() + String.fromCharCode(startCharCode + j);
                seatData.push({
                    seatNumber: seatNumber,
                    isBooked: bookedSeatCodes.includes(seatNumber) ? true : false,
                    isUser: userSeatCodes.includes(seatNumber) ? true : false
                });
            }
        }

        return seatData;
    };

    /* every time I mount the component I call the useEffect to updated data.
        every time I switch from one route to another the component gets unmounted,
        therefore when I go again to this route, the useEffect will be called again */

    /* dependency loggedIn instead of [] so that when the users logs in or logs out the color of the
    seats changes */

    /* this first useEffect will change the state of dirty (which will
        trigger a re-render of App.jsx), and will allow the second
    useEffect to be executed */

    useEffect(() => {
        setDirty(true);
    }, [loggedIn])

    useEffect(() => {
        if (dirty) {
            const init = async () => {
                try {
                    /* first API call returns seatsStatus, with info about the
                    airplane and info about bookedSeats */
                    const seatsStatus = await API.getSeatsStatus(airplane_id);
                    /* second API call returns the seats booked by the loggedIn user,
                    if the user is loggedIn */
                    const userSeatsTemp = loggedIn ? await API.getUserSeats(airplane_id) : [];
                    /* I need to store the fetched data into a state so it re-renders
                        the components and fills in the fetched data */
                    setAirplaneInfo(seatsStatus.airplaneInfo)
                    setairplaneBookedSeats(seatsStatus.bookedSeats);
                    setSeatData(generateSeatData(seatsStatus.bookedSeats, userSeatsTemp,
                        seatsStatus.airplaneInfo.totalrows, seatsStatus.airplaneInfo.totalcolumns));
                } catch (err) {
                    handleErrors(err);
                }
            };
            init();
            setDirty(false);
        }
    }, [dirty]);


    return (
        <Container className='below-nav'>
            <Link to="/" className="text-white">
                <Button variant="primary" onClick={() => setLoadAirplaneInfo(true)}>
                    Back
                </Button>
            </Link>
            <Container className="d-flex align-items-center justify-content-center">
                {airplaneInfo ? <SeatTable airplaneInfo={airplaneInfo}
                    bookedSeatsNumber={airplaneBookedSeats.length}
                    loggedIn={loggedIn} setDirty={setDirty} seatData={seatData} /> : <LoadingLayout />}
            </Container>
        </Container>
    );
}


function DefaultLayout(props) {

    const { airplanes } = props;

    return (
        <Container className="d-flex align-items-center justify-content-center vh-100">
            <Row>
                {airplanes.map((airplane) => (
                    <Col md={4} key={airplane.airplane_id}>
                        <AirplaneCard airplane={airplane} />
                    </Col>
                ))}
            </Row>
        </Container>


    );
}

function NotFoundLayout(props) {
    const { setLoadAirplaneInfo } = props;
    return (
        <Container className="d-flex align-items-center justify-content-center vh-100">
            <Row>
                <Col md={12} className="text-center">
                    <h2>This is not the route you are looking for!</h2>
                    <Link to="/" className="text-white">
                        <Button variant="primary" onClick={() => setLoadAirplaneInfo(true)}>
                            Go Home
                        </Button>
                    </Link>
                </Col>
            </Row>
        </Container>

    );
}

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
    return (
        <Row className="vh-100">
            <Col className="d-flex align-items-center justify-content-center below-nav">
                <Button variant="primary" disabled>
                    <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                    Loading...
                </Button>
            </Col>
        </Row>
    )
}

function LoginLayout(props) {
    return (
        <Row className="vh-100">
            <Col md={12} className="below-nav">
                <LoginForm login={props.login} setLoadAirplaneInfo={props.setLoadAirplaneInfo} />
            </Col>
        </Row>
    );
}

export { LoginLayout, NotFoundLayout, LoadingLayout, DefaultLayout, ViewSeatLayout }; 