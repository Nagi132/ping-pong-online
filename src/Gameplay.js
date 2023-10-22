
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const Gameplay = props => {

    const canvasRef = useRef(null);  
    const TABLE_WIDTH = window.innerWidth/2 - 500;
    const TABLE_HEIGHT = window.innerHeight/2 - 300;

    // Varibales for ball and its speed
    const [ballX, setBallX] = useState(500);
    const [ballSpeedX, setBallSpeedX] = useState(12.5);
    const [ballY, setBallY] = useState(300);
    const [ballSpeedY, setBallSpeedY] = useState(10);

    // Variables for paddle
    const [paddle1Y, setPaddle1Y] = useState(350);
    const [paddle2Y, setPaddle2Y] = useState(350);
    const PADDLE_HEIGHT = 100;
    const PADDLE_THICKNESS = 10;

    // Scoring
    // let player1Score = 0;
    // let player2Score = 0;
    // const WINNING_SCORE = 3;
    // let winner = false;

    // draw function 
    const draw =  useCallback( (context) => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        // Setting up ping pong table on canvas
        // green table
        colorRect(context, TABLE_WIDTH, TABLE_HEIGHT, 1000, 600,'#00A650');
        // net
        for(let i = TABLE_HEIGHT; i < window.innerHeight - TABLE_HEIGHT; i+=30){
            colorRect(context, TABLE_WIDTH+500, i, 2, 25, 'white');
        } 

        // this is left player paddle
        colorRect(context, TABLE_WIDTH, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT,'white');
        // this is right computer paddle
        colorRect(context, window.innerWidth-TABLE_WIDTH-PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT,'white');
        // draws ball
        colorCircle(context, TABLE_WIDTH+ballX, TABLE_HEIGHT+ballY, 10, 'white');

    }, [TABLE_HEIGHT, TABLE_WIDTH, ballX, ballY, paddle1Y, paddle2Y]);
  
    const movement = useCallback( () => {
        setBallX.current += setBallSpeedX.current;
        setBallY.current += setBallSpeedY.current;
    },[]);


    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.canvas.height = window.innerHeight;
        context.canvas.width = window.innerWidth;

        // draw and movement
        // let framesPerSecond = 30;
        // setInterval(function() {
        //     draw(context);
        //     movement();
        // }, 1000/framesPerSecond)
        //let frameCount = 0;
        let animationFrameId;
        const render = () => {
            //frameCount++;
            draw(context);
            animationFrameId = window.requestAnimationFrame(render);
          }
          render()
          return () => {
            window.cancelAnimationFrame(animationFrameId)
          }

    }, [TABLE_HEIGHT, TABLE_WIDTH, ballX, ballY, paddle1Y, paddle2Y, draw, movement])


    function colorRect(context, leftX, topY, width, height, drawColor) {
        context.fillStyle = drawColor;
        context.fillRect(leftX, topY, width, height);
    }

    function colorCircle(context, centerX, centerY, radius, drawColor) {
        context.fillStyle = drawColor;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI*2, true);
        context.fill();
    }


    return (
        <div className="container">  
            {/* back button */}
            <div className="back">
                <Link to={`../`}><button className="button">Quit</button></Link>
            </div>

            <canvas ref={canvasRef} {...props}/>
        </div>
    );
}
export default Gameplay