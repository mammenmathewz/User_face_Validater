
# FaceDetectionModule

FaceDetectionModule is a simple JavaScript library that provides face detection and verification functionality using the face-api.js library. It allows real-time face detection from a video stream and can verify if the detected face matches a reference image.

# Features

Face Detection: Detect faces using face-api.js from the webcam video stream.
Face Verification: Compare a live face with a pre-loaded reference image at regular intervals.
Canvas Overlay: Option to display the face detection results with landmarks on a canvas.
Configurable Detection Interval: Customize detection and verification intervals.
Custom Callbacks: Handle user presence and absence through callbacks.


## Installation

You can install the module via npm:

```bash
  npm install face-detection-module
```
    
## Usage/Examples

# 1. Import the module and load models:
```javascript
import FaceDetectionModule from 'face-detection-module';

// Create an instance of the module
const faceDetection = new FaceDetectionModule();

// Load the face detection models from CDN
await faceDetection.loadModels();

```
# 2. Start face detection:

```javascript
faceDetection.startDetection({
  callback: (isUserPresent) => {
    if (isUserPresent) {
      console.log('User is present.');
    } else {
      console.log('User is not present.');
    }
  },
  detectionIntervalTime: 100, // Time interval for detection in milliseconds
  userNotPresentThreshold: 20000, // Threshold for detecting user absence in milliseconds (default: 20 seconds)
  useCanvas: true // Set to true if you want to display detection results on a canvas
});


```

# 3. Verify live face with a reference image:
To compare the detected face with a reference image (for face verification):

```javascript
// Load the reference image to compare with live detections
await faceDetection.loadReferenceImage('path/to/reference/image.jpg');

// Start detection and face verification
faceDetection.startDetection({
  callback: (isSamePerson) => {
    if (isSamePerson) {
      console.log('The face matches the reference image.');
    } else {
      console.log('The face does not match the reference image.');
    }
  },
  useCanvas: true // Optional: Use a canvas to display the video and detections
});



```

# Example Workflow in React 

This section demonstrates how to use the FaceDetectionModule in a React application to detect a user's face and validate it against a reference image at regular intervals.

## Import and Set Up in React Component

You can now use the module in your React app. Below is a sample React component that shows how to implement the face detection and validation features of the FaceDetectionModule.

```javascript
import React, { useEffect, useState } from 'react';
import FaceDetectionModule from 'face-detection-module';

const FaceDetectionComponent = () => {
  const [isUserPresent, setIsUserPresent] = useState(null);
  const [isFaceMatched, setIsFaceMatched] = useState(null);
  const faceDetection = new FaceDetectionModule();

  // Load the face detection models when the component mounts
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceDetection.loadModels();
        console.log('Models loaded successfully.');
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, [faceDetection]);

  // Start face detection with validation when component mounts
  useEffect(() => {
    const startFaceDetection = async () => {
      try {
        // Load reference image for face validation
        await faceDetection.loadReferenceImage('/path/to/reference-image.jpg');

        // Start detection with a callback that will run every 500ms
        faceDetection.startDetection({
          callback: (isSamePerson) => {
            setIsUserPresent(true); // Update if user is present
            setIsFaceMatched(isSamePerson); // Update if the face matches reference
          },
          detectionIntervalTime: 500, // Check every 500ms
          userNotPresentThreshold: 10000, // User absent after 10 seconds
          useCanvas: true, // Use a canvas to display detection results
        });
      } catch (error) {
        console.error('Error starting face detection:', error);
      }
    };

    startFaceDetection();

    // Clean up and stop detection when the component unmounts
    return () => {
      faceDetection.stopDetection();
    };
  }, [faceDetection]);

  return (
    <div>
      <h1>Face Detection with Validation</h1>
      <video id="videoElement" width="640" height="480" autoPlay muted />
      
      {/* Show results based on the state */}
      <div>
        {isUserPresent !== null && (
          <p>{isUserPresent ? 'User is present.' : 'User is not present.'}</p>
        )}
        {isFaceMatched !== null && (
          <p>{isFaceMatched ? 'Face matched the reference image.' : 'Face did not match the reference image.'}</p>
        )}
      </div>
    </div>
  );
};

export default FaceDetectionComponent;




```