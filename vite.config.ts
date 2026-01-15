import pug from '@vituum/vite-plugin-pug';
import JSONImporter from '@blakedarlin/sass-json-importer'; // Import the JSON importer


// import { defineConfig } from 'vite';

export default {
  plugins: [
    pug()
  ],
  build: {
    rollupOptions: {
      input: ['index.pug.html']
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        importers: [
          JSONImporter(), // For importing JSON files
        ],
      },
    },
  }
}