import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

function DetectFace() {
  const [name, setName] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loadModels = async () => {
    try {
      // Load only the required models for detection, landmarks, and recognition
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      
      startVideo();
    } catch (err) {
      console.error("Error loading models:", err);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(err => console.error('Error accessing webcam:', err));
  };

  const detectFace = async () => {
    if (videoRef.current && canvasRef.current) {
      const faceData = JSON.parse(localStorage.getItem('faceData')) || [];
      if (faceData.length === 0) return; // If no face data in localStorage, no need to proceed

      const labeledFaceDescriptors = faceData.map(face => 
        new faceapi.LabeledFaceDescriptors(face.name, [new Float32Array(face.descriptor)]));
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      // Detect faces and landmarks
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const canvas = canvasRef.current;
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear the canvas and draw the detections
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      detections.forEach(detection => {
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        if (bestMatch && bestMatch.label !== 'unknown') {
          setName(bestMatch.label);
        }
      });
    }
  };

  useEffect(() => {
    loadModels();

    const interval = setInterval(detectFace, 1000); // Capture every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          
          objectFit: 'cover', // Ensure the video covers the entire screen
          zIndex: 1
        }}
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,

          zIndex: 2
        }}
      />
      {name && <p style={{ position: 'absolute', zIndex: 99, fontWeight: 'bold', color: 'red' }}>Detected: {name}</p>}
    </div>
  );
}

export default DetectFace;
