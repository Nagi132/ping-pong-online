
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const Gameplay = () => {

    // set up canvas 
    const canvasRef = useRef();

    // set replay button
    const buttonReplay = useRef();

    // frame counter
    const [counter, setCounter] = useState(0);

    // table width and height
    const TABLE_WIDTH = 1000;
    const TABLE_HEIGHT = 600

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
    const WINNING_SCORE = 3;

    // function for ball movement
    const ballMovement = () => {
        // sets ball velocity
        setBallX(x => x += ballSpeedX * 0.65);
        setBallY(y => y += ballSpeedY * 0.65);
    };
    const collision = () => { 
        // when ball reaches top or bottom of screen, reverse direction
        if(ballY + ballSpeedY < 0 || ballY + ballSpeedY > TABLE_HEIGHT) {
            setBallSpeedY(-ballSpeedY); 
        }

        if (ballX < 0 && ballY > paddle1Y && ballY < paddle1Y+PADDLE_HEIGHT) {
            setBallX(x => x + 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle1Y+PADDLE_HEIGHT/2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }
        else if (ballX > TABLE_WIDTH && ballY > paddle2Y && ballY < paddle2Y+PADDLE_HEIGHT) {
            setBallX(x => x - 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle2Y+PADDLE_HEIGHT/2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }
        else if (ballX < 0){
            setPlayer2Score(s => s + 1);
            ballReset();
        }
        else if(ballX > TABLE_WIDTH){
            setPlayer1Score(s => s + 1);
            ballReset();
        } 
    }
    // when wall collision occurs
    const ballReset = () => {
        setBallX(500);
        setBallY(300);
        setBallSpeedX(-ballSpeedX);    
    }

    //computer movement
    const computerMovement = () => {
        //speeds up from long range
        if(paddle2Y < ballY - 100) setPaddle2Y(y => y + 50 * (Math.random() + 1));
        //slow at close range
        else if(paddle2Y < ballY - 50) setPaddle2Y(y => y + 15 * (Math.random() + 1));
        
        //opposite directions

        else if (paddle2Y > ballY + 100) setPaddle2Y(y => y - 50 * (Math.random() + 1));

        else if (paddle2Y > ballY + 50) setPaddle2Y(y => y - 15 * (Math.random() + 1));

        // harder difficulty
        // if(paddle2Y < ballY - 50) setPaddle2Y(y => y + 20 * Math.random());
        // else if (paddle2Y > ballY + 50) setPaddle2Y(y => y - 20 * Math.random());
    }

    const replay = () => {
        if (winner) {
            setPlayer1Score(0);
            setPlayer2Score(0);
            setWinner(false);
        } 
    }

    // used to animate canvas and sets frame counter
    useLayoutEffect(() => {
        let timerId;
        const animate = () => {                
            setCounter(c => c + 1);
            timerId = requestAnimationFrame(animate);
            if(winner) cancelAnimationFrame(timerId);
        };
        timerId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(timerId);
    }, [winner])

    // draw canvas
    useEffect(() => {
        // gets canvas and context to use
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.canvas.height = TABLE_HEIGHT;
        context.canvas.width = TABLE_WIDTH;

        // creates green table
        context.fillStyle = '#00A650';
        context.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        context.fillStyle = '#FFFFFF';
        // net
        for(let i = 0; i < TABLE_WIDTH; i+=30){
            context.fillRect(TABLE_WIDTH/2, i, 2, 25);
        } 
        // left player paddle
        context.fillRect(0, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // right CPU paddle
        context.fillRect(TABLE_WIDTH-PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // draws ball
        context.beginPath();
        context.arc(ballX, ballY, 10, 0, Math.PI*2, true);
        context.fill();

        // movement functions
        ballMovement();
        computerMovement();
        collision();
        if(player1Score === WINNING_SCORE || player2Score === WINNING_SCORE) setWinner(true);

        // player movement
        const updateMousePosition = event => {
            let rect = canvas.getBoundingClientRect();
            setMousePosition({x: event.clientX - rect.left, y: event.clientY - rect.top})
            if(mousePosition.y > 0 && mousePosition.y < TABLE_HEIGHT ) setPaddle1Y(mousePosition.y - (PADDLE_HEIGHT/2));
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
          <Link to={`../Lobby`}><button className="button">Quit</button></Link>
      </div>
      <div className='score'>
        <h1>{player1Score}</h1>
        <h2 className='winner'> {winner ? 'Game over!' : ''} </h2>
        <h1>{player2Score}</h1> 
      </div>
      {/* gameplay */}
      <div className="canvas-container">
        <canvas ref={canvasRef}/>
      </div>
      <div className='replay'>
        {winner && <button onClick={replay} ref={buttonReplay}>Replay?</button>}
      </div>
    </div>
    );
}
export default Gameplay;