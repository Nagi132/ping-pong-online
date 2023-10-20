import React, { useRef, useEffect } from 'react';

const Canvas = props => {
  
  const canvasRef = useRef(null);  

  // Setting up ping pong table on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.canvas.height = window.innerHeight;
    context.canvas.width = window.innerWidth;
    
    context.fillStyle = '#8E8673';
    context.fillRect(0,0, canvas.width, canvas.height);
    context.fillStyle = '#00A650';
    context.fillRect(canvas.width/2 - 500, canvas.height/2 - 300, 1000, 600);
  }, [])
  
  return <canvas ref={canvasRef} {...props}/>
}

export default Canvas;