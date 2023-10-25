
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const Gameplay = () => {

    const canvasRef = useRef();
    const [counter, setCounter] = useState(0);

    const TABLE_WIDTH = window.innerWidth/2 - 500;
    const TABLE_HEIGHT = window.innerHeight/2 - 300;

    const [ballX, setBallX] = useState(500);
    const [ballY, setBallY] = useState(300);
    const [ballSpeedX, setBallSpeedX] = useState(0);
    const [ballSpeedY, setBallSpeedY] = useState(0);

    // Variables for paddle
    const [paddle1Y, setPaddle1Y] = useState(350);
    const [paddle2Y, setPaddle2Y] = useState(350);
    const PADDLE_HEIGHT = 100;
    const PADDLE_THICKNESS = 10;

    let player1Score = 0;
    let player2Score = 0;
    const WINNING_SCORE = 3;
    let winner = false;

    const movement = () => {
        if(winner) return;
        setBallSpeedX(7);
        setBallSpeedY(5);
        setBallX(x => x += ballSpeedX);
        setBallY(y => y += ballSpeedY);

        if(ballX <= 10) {
            if(ballY > paddle1Y && ballY < paddle1Y+PADDLE_HEIGHT) {
                setBallSpeedX(-ballSpeedX);
                let deltaY = ballY- (paddle1Y+PADDLE_HEIGHT/2);
                setBallSpeedY(deltaY * 0.35);
            } 
            else {
                player2Score++; // must be before ballReset()
                ballReset();
            }
        }
        if(ballX >= 1000) {
            if(ballY > paddle2Y && ballY < paddle2Y+PADDLE_HEIGHT) {
                setBallSpeedX(-ballSpeedX);
                let deltaY = ballY - (paddle2Y+PADDLE_HEIGHT/2);
                setBallSpeedY(deltaY * 0.35);
            }
            else {
                player1Score++; // must be before ballReset()
                ballReset();
            }
        }
        if(ballY < 0 || ballY > 600) {
            setBallSpeedY(-ballSpeedY); 
        }
    };
    function ballReset() {
        if(player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) 
            winner = true;
        setBallX(500);
        setBallY(300);
        setBallSpeedX(-ballSpeedX);        
    }

    useLayoutEffect(() => {
        let timerId
        const animate = () => {                
            setCounter(c => c + 1)
            timerId = requestAnimationFrame(animate)
        }
        timerId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(timerId)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.canvas.height = window.innerHeight;
        context.canvas.width = window.innerWidth;

        context.fillStyle = '#00A650';
        context.fillRect(TABLE_WIDTH, TABLE_HEIGHT, 1000, 600);

        context.fillStyle = '#FFFFFF';
        // net
        for(let i = TABLE_HEIGHT; i < window.innerHeight - TABLE_HEIGHT; i+=30){
            context.fillRect(TABLE_WIDTH+500, i, 2, 25);
        } 
        // this is left player paddle
        context.fillRect(TABLE_WIDTH, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // this is right computer paddle
        context.fillRect(window.innerWidth-TABLE_WIDTH-PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // draws ball
        context.beginPath();
        context.arc(TABLE_WIDTH+ballX, TABLE_HEIGHT+ballY, 10, 0, Math.PI*2, true);
        context.fill();
        
        movement();
             
    },[counter])

    return (
    <div className="container">  
      {/* back button */}
      <div className="back">
          <Link to={`../`}><button className="button">Quit</button></Link>
      </div>
      <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT}/>
    </div>
    );
}
export default Gameplay;