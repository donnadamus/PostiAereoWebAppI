import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { React, useState, useEffect, useContext } from 'react';
import { Container, Toast } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Navigation } from './components/Navigation';
import { NotFoundLayout, LoginLayout, LoadingLayout, DefaultLayout, ViewSeatLayout } from './components/PageLayout';

import MessageContext from './messageCtx';
import API from './API';

function App() {


  const [dirty, setDirty] = useState(true);

  // This state contains the user's info.
  const [user, setUser] = useState(null);

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);

  const [airplanes, setAirplanes] = useState([]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');

  const [loadAirplaneInfo, setLoadAirplaneInfo] = useState(true);

  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
  }

  /**
 * This function handles the login process.
 * It requires a username and a password inside a "credentials" object.
 */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
* This function handles the logout process.
*/
  const handleLogout = async () => {
    try {
      await API.logOut();
      setLoggedIn(false);
      setUser(null);
    } catch (err) {
      handleErrors(err);
    }
  };


  /* this useEffect is executed the first time the component is mounted and every
    time the user navigates to the route /
    It would not be enough to reload data only when the user performs an action,
    and so when seatData changes. This is because the user could not do any action
    and go back to route /. Here we should show the correct numbers of taken seats.  */

    /* the alternative was, as just mentioned, to bring the seatData state in App.jsx
    and launch this useEffect only when the seatData was modified. But that only happens
    when the user does an action (booking, delete booking, load airplane page). Therefore 
    it would not be enough to always show the correct info to the user, because in the 
    meanwhile another use could change the seats status */

  useEffect(() => {
    const init = async () => {
      try {
        if (loadAirplaneInfo) {
          setLoading(true);
          const loadAirplanes = await API.getAirplanesInfo();
          setAirplanes(loadAirplanes);
          setLoading(false);
          setLoadAirplaneInfo(false);
        }
      } catch (err) {
        handleErrors(err);
      }
    };
    init();
  }, [loadAirplaneInfo]);

  /* the following useEffect is executed only when the component is mounted */

  useEffect(() => {
    const init = async () => {
      try {
        const user = await API.getUserInfo();  // here you have the user info, if already logged in
        setUser(user);
        setLoggedIn(true);
      } catch (err) {
        setUser(null);
        setLoggedIn(false);
      }
    };
    init();
  }, []);


  /*
  When a route changes, 
  React Router unmounts the previous component and mounts 
  the new component associated with the new route.
  */

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container fluid className="App">
          <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} setLoadAirplaneInfo={setLoadAirplaneInfo}/>
          <Routes>
            <Route path="/" element={
              loading ? <LoadingLayout /> : <DefaultLayout airplanes={airplanes} />
            } />
            <Route path="/airplanes/:airplane_id" element={<ViewSeatLayout loggedIn={loggedIn}
              dirty={dirty} setDirty={setDirty} setLoadAirplaneInfo={setLoadAirplaneInfo}/>} />
            <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin} setLoadAirplaneInfo={setLoadAirplaneInfo}/> : <Navigate replace to='/' />} />
            <Route path="*" element={<NotFoundLayout setLoadAirplaneInfo={setLoadAirplaneInfo}/>} />
          </Routes>
          <Toast show={message !== ''} onClose={() => setMessage('')} delay={5000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  );

}

export default App;
