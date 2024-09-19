import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognition = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [livenessCheck, setLivenessCheck] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true); // Indicate models are loaded
        console.log('Models loaded successfully');
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error('Error accessing webcam: ', err));
    };

    startVideo();
  }, []);

  useEffect(() => {
    if (videoRef.current && canvasRef.current && modelsLoaded) {
      const handleVideo = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        video.addEventListener('loadeddata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          faceapi.matchDimensions(canvas, video);

          const intervalId = setInterval(async () => {
            if (isScanning) {
              try {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

                if (canvas.width > 0 && canvas.height > 0) {
                  const resizedDetections = faceapi.resizeResults(detections, canvas);
                  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                  if (livenessCheck && detections.length > 0) {
                    const landmarks = detections[0]?.landmarks;
                    if (landmarks) {
                      const leftEye = landmarks.getLeftEye();
                      const rightEye = landmarks.getRightEye();

                      // Simple eye blink detection (rudimentary check)
                      const leftEyeBlink = leftEye.some(point => point.y > leftEye[0].y + 5);
                      const rightEyeBlink = rightEye.some(point => point.y > rightEye[0].y + 5);

                      if (leftEyeBlink || rightEyeBlink) {
                        console.log('Eye blink detected!');
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Error during face detection:', error);
              }
            }
          }, 100); // Check every 100ms

          return () => clearInterval(intervalId);
        });
      };

      handleVideo();
    }
  }, [isScanning, livenessCheck, modelsLoaded]);

  const handleStartScan = () => {
    setIsScanning(true);
    setLivenessCheck(true);
    setTimeout(async () => {
      setIsScanning(false);
      setLivenessCheck(false);
      try {
        const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
        const faceData = detections ? faceapi.computeFaceDescriptor(detections) : null;
        if (faceData) {
            console.log('Face data: detected');
        }
      } catch (error) {
        console.error('Error during face scan:', error);
      }
    }, 3000); // Scan for 3 seconds
  };

  return (
    <div>
      <video ref={videoRef} autoPlay muted />
      <canvas ref={canvasRef} />
      <button onClick={handleStartScan} disabled={isScanning || !modelsLoaded}>
        {isScanning ? 'Scanning...' : 'Start Scan'}
      </button>
    </div>
  );
};

export default FaceRecognition;
