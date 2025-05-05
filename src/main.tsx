import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DragDropContext } from 'react-beautiful-dnd'
import ReactDOM from 'react-dom/client'
import React from 'react'

createRoot(document.getElementById("root")!).render(
<React.StrictMode>
    <DragDropContext onDragEnd={() => {}}>
      <App />
    </DragDropContext>
</React.StrictMode>,
  );
