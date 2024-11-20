'use strict';

var faceapi = require('face-api.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var faceapi__namespace = /*#__PURE__*/_interopNamespaceDefault(faceapi);

class FaceDetectionModule {
  constructor() {
    this.modelsLoaded = false;
    this.detectionInterval = null;
    this.lastDetectionTime = null;
    this.userPresentCallback = null;
    this.userNotPresentThreshold = 20000; // Default to 20 seconds
    this.videoElement = null; // Hold reference to video element
  }

  async loadModels() {
    try {
      const modelPath = new URL('../models/', (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.js', document.baseURI).href))).toString(); // Dynamically resolve model path
      await faceapi__namespace.nets.tinyFaceDetector.loadFromUri(modelPath);
      await faceapi__namespace.nets.faceLandmark68Net.loadFromUri(modelPath);
      await faceapi__namespace.nets.faceRecognitionNet.loadFromUri(modelPath);

      console.log('Models loaded successfully');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  }

  startDetection({ 
    callback, 
    detectionIntervalTime = 100, 
    userNotPresentThreshold = 20000, 
    useCanvas = false 
  } = {}) {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }
  
    this.userPresentCallback = callback;
    this.userNotPresentThreshold = userNotPresentThreshold;

    // Create video element and request camera access
    this.videoElement = document.createElement('video');
    this.videoElement.width = 640;
    this.videoElement.height = 480;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.videoElement.srcObject = stream;
        return new Promise(resolve => {
          this.videoElement.onloadedmetadata = () => resolve(this.videoElement.play());
        });
      })
      .then(() => {
        let canvas;
        let displaySize;

        if (useCanvas) {
          canvas = faceapi__namespace.createCanvasFromMedia(this.videoElement);
          document.body.append(canvas);
          displaySize = { width: this.videoElement.videoWidth, height: this.videoElement.videoHeight };
          canvas.width = this.videoElement.videoWidth;
          canvas.height = this.videoElement.videoHeight;
          faceapi__namespace.matchDimensions(canvas, displaySize);
        }

        const detectionOptions = new faceapi__namespace.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        });

        this.detectionInterval = setInterval(async () => {
          const detections = await faceapi__namespace.detectAllFaces(this.videoElement, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            this.lastDetectionTime = Date.now();
            if (this.userPresentCallback) {
              this.userPresentCallback(true);
            }
          } else if (this.lastDetectionTime && Date.now() - this.lastDetectionTime > this.userNotPresentThreshold) {
            if (this.userPresentCallback) {
              this.userPresentCallback(false);
            }
          }

          if (useCanvas) {
            const resizedDetections = faceapi__namespace.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi__namespace.draw.drawDetections(canvas, resizedDetections);
            faceapi__namespace.draw.drawFaceLandmarks(canvas, resizedDetections);
          }
        }, detectionIntervalTime);
      })
      .catch(error => {
        console.error('Error starting detection:', error);
      });
  }

  stopDetection() {
    // Stop the detection interval if it's running
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    // Stop the video stream and remove the video element
    if (this.videoElement) {
      const stream = this.videoElement.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // Stop each track
      }
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null; // Clear reference to the video element
    }

    // Remove canvas if it was created
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.remove();
    }

    console.log("Face detection stopped and camera turned off.");
  }
}

module.exports = FaceDetectionModule;
