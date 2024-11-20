import * as faceapi from 'face-api.js';

class FaceDetectionModule {
  constructor({ modelPath = 'https://cdn.example.com/face-api/models/' } = {}) {
    this.modelsLoaded = false;
    this.detectionInterval = null;
    this.lastDetectionTime = null;
    this.userPresentCallback = null;
    this.userNotPresentThreshold = 20000; // Default to 20 seconds
    this.videoElement = null; // Hold reference to video element
    this.modelPath = modelPath; // Set the model path from user input or default
  }

  async loadModels() {
    try {
      console.log('Loading models from:', this.modelPath); // Log the path for debugging

      // Load the models from the user-provided model path (now using CDN URLs)
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath + 'tiny_face_detector_model-weights_manifest.json');
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath + 'face_landmark_68_model-weights_manifest.json');
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath + 'face_recognition_model-weights_manifest.json');

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
          canvas = faceapi.createCanvasFromMedia(this.videoElement);
          document.body.append(canvas);
          displaySize = { width: this.videoElement.videoWidth, height: this.videoElement.videoHeight };
          canvas.width = this.videoElement.videoWidth;
          canvas.height = this.videoElement.videoHeight;
          faceapi.matchDimensions(canvas, displaySize);
        }

        const detectionOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        });

        this.detectionInterval = setInterval(async () => {
          const detections = await faceapi.detectAllFaces(this.videoElement, detectionOptions)
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
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
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

export default FaceDetectionModule;
