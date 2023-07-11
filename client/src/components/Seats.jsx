import { Button, Container, Row, Col} from 'react-bootstrap';
import './style/BlinkingButton.css'

const Seats = (props) => {

    const { seatData, onSeatSelect, numRows, numColumns, loggedIn, requestedSeats, alreadyTakenSeats, buttonBlinking } = props;

    const renderSeats = () => {
        return seatData.map((seat) => (
            <Col key={seat.seatNumber} xs={1} className="mb-3 px-1 d-flex justify-content-center">
                <Button
                    className={buttonBlinking && alreadyTakenSeats.includes(seat.seatNumber) ? 'blinking-button blinking' : ''}
                    variant={seat.isUser ? 'primary' : seat.isBooked ? 'danger' : requestedSeats.includes(seat.seatNumber) && loggedIn ? 'warning' : 'success'}
                    disabled={loggedIn ? seat.isBooked : true}
                    onClick={() => {
                        if (!seat.isBooked) {
                            onSeatSelect(seat.seatNumber);
                        }
                    }}
                >
                    {seat.seatNumber}
                </Button>
            </Col>
        ));
    };

    const renderRows = () => {
        const rows = [];

        for (let i = 0; i < numRows; i++) {
            const rowSeats = renderSeats().slice(i * numColumns, (i + 1) * numColumns);
            rows.push(
                <Row key={i} className="justify-content-center">
                    {rowSeats}
                </Row>
            );
        }

        return rows;
    };

    return <Container>{renderRows()}</Container>;
};

export { Seats };