import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

function CaptureFace() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nameRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [faceDataStored, setFaceDataStored] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models'); // Load tinyFaceDetector model
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models'); // Load emotion model
      startVideo();
    } catch (err) {
      console.error("Error loading models:", err);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
        setLoading(false);
      });
  };

  const detectSmile = async () => {
    const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    const smileDetection = detections.some(detection => {
      const expressions = detection.expressions.asSortedArray();
      return expressions[0].expression === 'happy';
    });

    if (smileDetection) {
      return true;
    }
    return false;
  };

  const captureFace = async () => {
    const name = nameRef.current.value;
    if (!name) {
      alert("Please enter a name.");
      return;
    }

    if (videoRef.current && canvasRef.current) {
      if (faceDataStored) {
        alert("Face data has already been stored.");
        return;
      }

      setProcessing(true);
      setCapturing(true);
      setPromptMessage('Please smile to store your face data.');

      const detectNeutralExpression = async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors();

        const neutralExpressions = detections.filter(detection => {
          const expressions = detection.expressions.asSortedArray();
          return expressions[0].expression === 'neutral';
        });

        if (neutralExpressions.length > 0) {
          // Continue to check for a smile
          const checkForSmileInterval = setInterval(async () => {
            const isSmiling = await detectSmile();
            if (isSmiling) {
              const descriptors = neutralExpressions.map(detection => detection.descriptor);
              const existingFaces = JSON.parse(localStorage.getItem('faceData')) || [];
              const newFaces = existingFaces.concat(descriptors.map(descriptor => ({ name, descriptor: Array.from(descriptor) })));
              localStorage.setItem('faceData', JSON.stringify(newFaces));

              clearInterval(checkForSmileInterval);
              setFaceDataStored(true);
              setPromptMessage('Face stored successfully!');
              setProcessing(false);
              setCapturing(false);
            }
          }, 1000); // Check for smile every 1 second

          // Stop checking after 10 seconds
          setTimeout(() => {
            if (capturing) {
              clearInterval(checkForSmileInterval);
              setPromptMessage('Time expired. Please try again.');
              setProcessing(false);
              setCapturing(false);
            }
          }, 10000); // 10 seconds timeout
        } else {
          alert("Neutral face not detected. Please try again.");
          setProcessing(false);
        }
      };

      detectNeutralExpression();
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: 'white',
            fontSize: '24px',
          }}
        >
          Loading models and webcam...
        </div>
      )}

      <video
        playsInline
        ref={videoRef}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '80vh',
          position: 'relative',
          display: loading ? 'none' : 'block',
        }}
        autoPlay
        muted
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {!loading && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <input
            ref={nameRef}
            type="text"
            placeholder="Enter your name"
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '80%',
              maxWidth: '300px',
              margin: '10px auto',
              display: 'block',
            }}
          />
          <button
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer',
              backgroundColor: processing ? 'grey' : 'blue',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              width: '80%',
              maxWidth: '300px',
              margin: '0 auto',
              display: 'block',
              zIndex: 999,
            }}
            onClick={captureFace}
            disabled={processing}
          >
            Capture Face
          </button>
          {promptMessage && (
            <div style={{ marginTop: '10px', fontSize: '18px', color: 'red' }}>
              {promptMessage}
            </div>
          )}
        </div>
      )}

      {processing && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="loader" style={{ color: 'white', fontSize: '24px' }}>Processing...</div>
        </div>
      )}
    </div>
  );
}

export default CaptureFace;
