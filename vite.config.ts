import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import SparkCompiler from './src/lib/compiler/SparkCompiler'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), SparkCompiler({ discoverDataTypes: true })],
  build: {
    outDir: 'docs'
  },
  base: 'https://danielbeeke.nl/spark/'
})
