import url from '@rollup/plugin-url';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/FaceDetectionModule.js',
    format: 'esm',
    globals: {
      'face-api.js': 'faceapi' // This tells Rollup that face-api.js will be available globally
    },
  },
  plugins: [
    resolve(),
    commonjs(),
    url({
      include: ['**/*.bin', '**/*.json'], // Include model files in the bundle
      limit: 0, // Always inline model files
    }),
  ],
  external: ['face-api.js'],  // Exclude face-api.js from the bundle
};
