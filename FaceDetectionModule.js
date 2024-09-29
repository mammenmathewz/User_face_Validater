import * as faceapi from 'face-api.js';

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
    const cdnPath = 'https://mammenmathewz.github.io/User_face_Validater/models'; 
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${cdnPath}`);
      await faceapi.nets.faceLandmark68Net.loadFromUri(`${cdnPath}`);
      await faceapi.nets.faceRecognitionNet.loadFromUri(`${cdnPath}`);
      console.info('Face detection models loaded successfully.');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Failed to load face detection models:', error);
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
      console.warn('Attempted to start detection before models were loaded.');
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
        
        console.info('Face detection started.');
      })
      .catch(error => {
        console.error('Error initializing face detection:', error);
      });
  }

  stopDetection() {
    // Stop the detection interval if it's running
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.info('Detection interval cleared.');
    }

    // Stop the video stream and remove the video element
    if (this.videoElement) {
      const stream = this.videoElement.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // Stop each track
        console.info('Video tracks stopped.');
      }
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null; // Clear reference to the video element
      console.info('Video element removed from the DOM.');
    }

    // Remove canvas if it was created
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.remove();
      console.info('Canvas removed from the DOM.');
    }

    console.info("Face detection stopped and camera turned off.");
  }
}

export default FaceDetectionModule;
