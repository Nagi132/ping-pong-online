import { useRef, useEffect } from 'react';

// Global Variables
var DIRECTION = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};
 
var rounds = [5, 5, 3, 3, 2];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6'];
 
// The ball object (The cube that bounces back and forth)
var Ball = {
    new: function (incrementedSpeed) {
        return {
            width: 18,
            height: 18,
            x: (this.canvas.width / 2) - 9,
            y: (this.canvas.height / 2) - 9,
            moveX: DIRECTION.IDLE,
            moveY: DIRECTION.IDLE,
            speed: incrementedSpeed || 3
        };
    }
};

   

export function Canvas(props) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    context.fillStyle = 'red';
    context.fillRect(0, 0, props.width, props.height);

    const clickHandler = () => {
      context.fillStyle = 'blue';
      context.fillRect(0, 0, props.width, props.height);
    };

    canvas.addEventListener('click', clickHandler);

    return () => {
      canvas.removeEventListener('click', clickHandler);
    };
  }, []);

  return <canvas ref={canvasRef} width={props.width} height={props.height} />;
}