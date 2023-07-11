import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import airplaneImage from '/images/airplane.jpg';

function AirplaneCard(props) {
    const { airplane } = props;
    const url = `/airplanes/${airplane.airplane_id}`;
    return (
        <Link to={url} className="card-link">
            <Card bg="primary" text="white" style={{ width: '18rem' }}>
                <Card.Img variant="top" src={airplaneImage} />
                <Card.Body className="text-center">
                    <Card.Title className="text-white">{airplane.type}</Card.Title>
                    <Card.Text className="text-white">
                        File: {airplane.totalrows}
                        <br />
                        Posti per fila: {airplane.totalcolumns}
                        <br />
                        Posti occupati: {airplane.totaltaken}
                        <br/>
                        Posti liberi: {(airplane.totalrows * airplane.totalcolumns) - airplane.totaltaken}
                        <br/>
                        Posti totali: {airplane.totalrows * airplane.totalcolumns}
                    </Card.Text>
                </Card.Body>
            </Card>
        </Link>

    );
}

export { AirplaneCard };