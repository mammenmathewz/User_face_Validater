// rollup.config.js
import url from '@rollup/plugin-url';
import resolve from '@rollup/plugin-node-resolve';  // Resolves node modules
import commonjs from '@rollup/plugin-commonjs';    // Converts CommonJS modules to ES6

export default {
  input: 'src/index.js',  // Entry point of your module
  output: {
    file: 'dist/FaceDetectionModule.js',  // Output file path
    format: 'esm',  // You can use 'cjs' or 'esm' depending on your needs
    globals: {
      // You don't need this if you're bundling face-api.js
    },
  },
  plugins: [
    resolve(),  // This ensures that Rollup will resolve node modules like face-api.js
    commonjs(), // This converts any CommonJS modules (like face-api.js) to ES modules
    url({
      include: ['**/*.bin', '**/*.json'],  // Bundle model files (optional)
      limit: 0,  // Always inline files
    }),
  ],
};
