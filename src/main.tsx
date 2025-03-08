import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Pokemon from './Pokemon.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Pokemon />
  </StrictMode>,
)
