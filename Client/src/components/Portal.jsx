// src/components/Portal.jsx
import { createPortal } from 'react-dom';

/**
 * Renders children outside the component's DOM hierarchy, typically into document.body.
 */
export default function Portal({ children }) {
  // Render children into the document.body
  return createPortal(children, document.body); 
}