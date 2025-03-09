import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import SparkCompiler from './SparkCompiler.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), SparkCompiler({
    entry: './src/spark.ts',
    root: './src',
    output: './src/spark-generated.ts'
  })],
  build: {
    outDir: 'docs'
  },
  base: 'https://danielbeeke.nl/spark/'
})
