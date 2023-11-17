
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const {num} = require('./components/difiiculty.js');

const Gameplay = () => {

    // get mode from lobby
    const location = useLocation();
    const mode = location.state?.mode || 'multiplayer';//default to multiplayer
    const isCPUmode = mode === 'cpu';

    // set up canvas 
    const canvasRef = useRef();

    // set replay button
    const buttonReplay = useRef();

    // frame counter
    const [counter, setCounter] = useState(0);

    // table width and height
    const TABLE_WIDTH = 1000;
    const TABLE_HEIGHT = 600;


    //ball speed and cpu speed modifier for difficulties
    
    var speedmodifier;
    var accuracy;
    if(num.dif == 0) {
        speedmodifier = 0.30;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.3;
    }
       
    else if(num.dif == 1) {
        speedmodifier = 0.43;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.2;
    }
    if(num.dif == 2) {
        speedmodifier = 0.7;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.1;
    }

    

    // ball x and y positions; vertical and horizontaly speed
    const [ballX, setBallX] = useState(500);
    const [ballY, setBallY] = useState(300);
    const [ballSpeedX, setBallSpeedX] = useState(15);
    const [ballSpeedY, setBallSpeedY] = useState(15);

    // paddles for player 1 and 2; constant paddle size
    const [paddle1Y, setPaddle1Y] = useState(350);
    const [paddle2Y, setPaddle2Y] = useState(350);
    const PADDLE_HEIGHT = 100; //starts from top then adds to bottom
    const PADDLE_THICKNESS = 10;

    // mouse movement
    const [mousePosition, setMousePosition] = useState({ x: null, y: null });

    // player scoring; winning score is 3
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [winner, setWinner] = useState(false);
    const WINNING_SCORE = 3;

    // function for ball movement
    const ballMovement = () => {
        // sets ball velocity
        setBallX(x => x += ballSpeedX * speedmodifier);
        setBallY(y => y += ballSpeedY * speedmodifier); 
    };
    const collision = () => {
        // when ball reaches top or bottom of screen, reverse direction
        if (ballY + ballSpeedY < 0 || ballY + ballSpeedY > TABLE_HEIGHT) {
            setBallSpeedY(-ballSpeedY);
        }

        // when ball collides with cpu. (if the ballY is at the same height as the top of the cpu paddle or lower,
        //and ballY at the same height as the bottom of the cpu paddle or higher, then collide with it,
        //+ or - 20 to the paddle height range to add leniency to the collision tracking)
        //
        if (ballX > TABLE_WIDTH && ballY >= paddle2Y - 30 && ballY <= paddle2Y+PADDLE_HEIGHT + 30) {
            setBallX(x => x - 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }
        //when ball collides with player, same logic as cpu collision 
        else if (ballX < 0 && ballY > paddle1Y - 30 && ballY < paddle1Y+PADDLE_HEIGHT + 40) {
            setBallX(x => x + 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle1Y+PADDLE_HEIGHT/2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }

        //when ball reaches left or right edge, add a point and reset
        else if (ballX < 0){
            setPlayer2Score(s => s + 1);
            ballReset();
        }
        else if (ballX > TABLE_WIDTH) {
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
        if (isCPUmode) {
                //if ball is coming towards the cpu paddle, and after a set distance. This is usually when a human would move their paddle
            if(ballSpeedX >= 0 && ballX > 150){  
                //if the ball speed is really low a human being is more likely to track it, so random is set lower and speed is higher
                if(paddle2Y + 50 + 50  < ballY && Math.abs(ballSpeedY) < 10) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * speedmodifier + 0.2 / (1 + (0.2*Math.random())));
                if(paddle2Y + 50 - 50  > ballY && Math.abs(ballSpeedY) < 10) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * -speedmodifier + 0.2 / (1 + (0.2*Math.random())));

                //paddle2Y + 50 is the center of the paddle, once the ballY is passed either edge of the paddle, adjust paddleY
                //to be within the edges of the paddle
                //if 
                if(paddle2Y + 50 + 50  < ballY && Math.random() > accuracy) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * speedmodifier + 0.2 / (1 + (accuracy *Math.random() + speedmodifier)));
                if(paddle2Y + 50 - 50  > ballY && Math.random() > accuracy) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY)  * -speedmodifier + 0.2 / (1 + (accuracy *Math.random() + speedmodifier)));
                
                

                //stuff to test the cpu collision boxes: 
                //setPaddle2Y(ballY - 50); //moves the center of paddle to the center of the ball immediately
                //setPaddle2Y(ballY); //moves the top of paddle to the center of the ball immediately

            }
        }
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
            if (winner) cancelAnimationFrame(timerId);
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
        for (let i = 0; i < TABLE_WIDTH; i += 30) {
            context.fillRect(TABLE_WIDTH / 2, i, 2, 25);
        }
        // left player paddle
        context.fillRect(0, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // right CPU paddle
        context.fillRect(TABLE_WIDTH - PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
        // draws ball
        context.beginPath();
        context.arc(ballX, ballY, 10, 0, Math.PI * 2, true);
        context.fill();

        // movement functions
        ballMovement();
        computerMovement();
        collision();
        if (player1Score === WINNING_SCORE || player2Score === WINNING_SCORE) setWinner(true);

        // player movement
        const updateMousePosition = event => {
            let rect = canvas.getBoundingClientRect();
            setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top })
            if (mousePosition.y > 0 && mousePosition.y < TABLE_HEIGHT) setPaddle1Y(mousePosition.y - (PADDLE_HEIGHT / 2));
        };
        canvas.addEventListener('mousemove', updateMousePosition);
        return () => {
            canvas.removeEventListener('mousemove', updateMousePosition);
        };

    }, [counter])

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
                <canvas ref={canvasRef} />
            </div>
            <div className='replay'>
                {winner && <button onClick={replay} ref={buttonReplay}>Replay?</button>}
            </div>
        </div>
    );
}
export default Gameplay;