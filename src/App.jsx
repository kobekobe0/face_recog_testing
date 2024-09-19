// App.js or main router file
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CaptureFace from './CaptureFace';
import DetectFace from './DetectFace';
import FaceRecognition from './Test';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CaptureFace />} />
        <Route path="/detect" element={<DetectFace />} />
        <Route path="/test" element={<FaceRecognition />} />
      </Routes>
    </Router>
  );
}

export default App;
