import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import RoomPage from './RoomPage';
const Allroutes = () => {
    return (
        <div>
            <Router>
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/dashboard' element={<Dashboard />} />
                    <Route path="/room/:roomId" element={<RoomPage />} />
                </Routes>
            </Router>
        </div>
    );
};

export default Allroutes;
