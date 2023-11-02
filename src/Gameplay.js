
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const Gameplay = () => {

    // set up canvas 
    const canvasRef = useRef();

    // frame counter
    const [counter, setCounter] = useState(0);

    // table width and height relative to window dimensions
    const TABLE_WIDTH = window.innerWidth/2 - 500;
    const TABLE_HEIGHT = window.innerHeight/2 - 300;

    // ball x and y positions; vertical and horizontaly speed
    const [ballX, setBallX] = useState(500);
    const [ballY, setBallY] = useState(300);
    const [ballSpeedX, setBallSpeedX] = useState(15);
    const [ballSpeedY, setBallSpeedY] = useState(15);

    // paddles for player 1 and 2; constant paddle size
    const [paddle1Y, setPaddle1Y] = useState(350);
    const [paddle2Y, setPaddle2Y] = useState(350);
    const PADDLE_HEIGHT = 100;
    const PADDLE_THICKNESS = 10;

    // mouse movement
    const [mousePosition, setMousePosition] = useState({x: null, y: null});

    // player scoring; winning score is 3
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [winner, setWinner] = useState(false);
    const WINNING_SCORE = 2;

    // function for ball movement
    const ballMovement = () => {
        // sets ball velocity
        setBallX(x => x += ballSpeedX * 0.75);
        setBallY(y => y += ballSpeedY * 0.75);
    };
    const collision = () => { 
        // when ball reaches top or bottom of screen, reverse direction
        if(ballY + ballSpeedY < 10 || ballY + ballSpeedY > 590) {
            setBallSpeedY(-ballSpeedY); 
        }

        if (ballX < 20 && ballY + 110 > paddle1Y && ballY < paddle1Y) {
            setBallX(x => x + 20);
            setBallSpeedX(-ballSpeedX);
            let deltaY = ballY - (paddle1Y+PADDLE_HEIGHT/2);
            setBallSpeedY(y => deltaY * .05);
        }
        else if (ballX <= 10){
            setPlayer2Score(s => s + 1);
            ballReset();
        }
        if (ballX > 990 && ballY + 110 > paddle2Y && ballY < paddle2Y) {
            setBallX(x => x - 20);
            setBallSpeedX(-ballSpeedX);
            let deltaY = ballY - (paddle2Y+PADDLE_HEIGHT/2);
            setBallSpeedY(y => deltaY * .05);
        }
        else if(ballX >= 990){
            setPlayer1Score(s => s + 1);
            ballReset();
        } 
    }
    // when wall collision occurs
    const ballReset = () => {
        // check for winner
        if(player1Score === WINNING_SCORE || player2Score === WINNING_SCORE) setWinner(true);
        setBallX(500);
        setBallY(300);
        setBallSpeedX(-ballSpeedX);        
    }

    //moves based on ball position
    const computerMovement = () => {
        if(paddle2Y < ballY - 75) setPaddle2Y(y => y + 15);
        else if (paddle2Y > ballY + 75) setPaddle2Y(y => y - 15);;
    }

    // used to animate canvas and sets frame counter
    useLayoutEffect(() => {
        let timerId;
        const animate = () => {                
            setCounter(c => c + 1)
            timerId = requestAnimationFrame(animate)
        };
        timerId = requestAnimationFrame(animate)
        if(winner) cancelAnimationFrame(timerId)
        return () => cancelAnimationFrame(timerId)
    }, [winner])

    // draw canvas
    useEffect(() => {
        // gets canvas and context to use
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.canvas.height = window.innerHeight;
        context.canvas.width = window.innerWidth;

        // creates green table
        context.fillStyle = '#00A650';
        context.fillRect(TABLE_WIDTH, TABLE_HEIGHT, 1000, 600);

        context.fillStyle = '#FFFFFF';
        // net
        for(let i = TABLE_HEIGHT; i < window.innerHeight - TABLE_HEIGHT; i+=30){
            context.fillRect(TABLE_WIDTH+500, i, 2, 25);
        } 
        // left player paddle
        context.fillRect(TABLE_WIDTH, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // right CPU paddle
        context.fillRect(window.innerWidth-TABLE_WIDTH-PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // draws ball
        context.beginPath();
        context.arc(TABLE_WIDTH+ballX, TABLE_HEIGHT+ballY, 10, 0, Math.PI*2, true);
        context.fill();

        // movement functions
        ballMovement();
        computerMovement();
        collision();

        // player movement
        const updateMousePosition = event => {
            setMousePosition({ x: event.clientX, y: event.clientY });
            if(mousePosition.y > 155 && mousePosition.y < 660 ) setPaddle1Y(mousePosition.y - (PADDLE_HEIGHT/2));
        };
        canvas.addEventListener('mousemove', updateMousePosition);
        return () => {
            canvas.removeEventListener('mousemove', updateMousePosition);
        };
             
    },[counter])

    return (
    <div className="container">  
      {/* back button */}
      <div className="back">
          <Link to={`../GameplayMenu`}><button className="button">Quit</button></Link>
      </div>
      <div className='score'>
        <h1>{player1Score}</h1>
        <h1>{player2Score}</h1> 
      </div>
      <h2 className='winner'> {winner ? 'Game over!' : ''} </h2>
      {/* gameplay */}
      <canvas ref={canvasRef}/>
    </div>
    );
}
export default Gameplay;