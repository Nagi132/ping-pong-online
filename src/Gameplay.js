import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import { debounce } from 'lodash';
import io from 'socket.io-client';
import './index.css';
import './Gameplay.css';


const { num } = require('./components/difiiculty.js');

const Gameplay = () => {

    // get mode from lobby
    const location = useLocation();
    const { role } = location.state || 'joiner';//default to joiner
    const mode = location.state?.mode || 'multiplayer';//default to multiplayer
    const roomId = location.pathname.split('/')[2];//get the room id from the url
    const isCPUmode = mode === 'cpu';

    // socket connection
    const socket = useRef();

    // game state
    const [gameState, setGameState] = useState({
        ballX: 500, ballY: 300, paddle1Y: 350, paddle2Y: 350,
        player1Score: 0, player2Score: 0, winner: false
    });

    // set up canvas 
    const canvasRef = useRef(null);

    useEffect(() => {
        socket.current = io('http://localhost:4000');
        console.log("roomId:", roomId);
        socket.current.emit('joinRoom', roomId);
        socket.current.on('gameUpdate', (newGameState) => {
            console.log("Received game state update:", newGameState);
            setGameState(newGameState);
        });

        return () => socket.current.disconnect();
    }, [roomId]);

    // Debounced function for emitting paddle movements
    const emitPaddleMove = useRef(debounce((y, roomId, paddle) => {
        // Simplify the data being sent
        socket.current.emit('paddleMove', { y, roomId, paddle });
    }, 5)).current;

    // Event listener for mouse movement
    useEffect(() => {
        const handleMouseMove = (event) => {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const newY = event.clientY - rect.top;
                // const paddleData = { y: newY, roomId, paddle: role === 'creator' ? 'left' : 'right' };
                //console.log("Paddle Data:", paddleData);
                emitPaddleMove(newY, roomId, role === 'creator' ? 'left' : 'right');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [role, roomId, emitPaddleMove]);
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
    if (num.dif == 0) {
        speedmodifier = 0.30;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.3;
    }

    else if (num.dif == 1) {
        speedmodifier = 0.43;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.2;
    }
    if (num.dif == 2) {
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
        if (ballX > TABLE_WIDTH && ballY >= paddle2Y - 30 && ballY <= paddle2Y + PADDLE_HEIGHT + 30) {
            setBallX(x => x - 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }
        //when ball collides with player, same logic as cpu collision 
        else if (ballX < 0 && ballY > paddle1Y - 30 && ballY < paddle1Y + PADDLE_HEIGHT + 40) {
            setBallX(x => x + 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));
        }

        //when ball reaches left or right edge, add a point and reset
        else if (ballX < 0) {
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
            if (ballSpeedX >= 0 && ballX > 150) {
                //if the ball speed is really low a human being is more likely to track it, so random is set lower and speed is higher
                if (paddle2Y + 50 + 50 < ballY && Math.abs(ballSpeedY) < 10)
                    setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * speedmodifier + 0.2 / (1 + (0.2 * Math.random())));
                if (paddle2Y + 50 - 50 > ballY && Math.abs(ballSpeedY) < 10)
                    setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * -speedmodifier + 0.2 / (1 + (0.2 * Math.random())));

                //paddle2Y + 50 is the center of the paddle, once the ballY is passed either edge of the paddle, adjust paddleY
                //to be within the edges of the paddle
                //if 
                if (paddle2Y + 50 + 50 < ballY && Math.random() > accuracy)
                    setPaddle2Y(y => y += Math.abs(ballSpeedY) * speedmodifier + 0.2 / (1 + (accuracy * Math.random() + speedmodifier)));
                if (paddle2Y + 50 - 50 > ballY && Math.random() > accuracy)
                    setPaddle2Y(y => y += Math.abs(ballSpeedY) * -speedmodifier + 0.2 / (1 + (accuracy * Math.random() + speedmodifier)));

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

    // draw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

        canvas.width = TABLE_WIDTH;
        canvas.height = TABLE_HEIGHT;

        let animationFrameId;

        //function to draw the game
        const drawGame = () => {
            console.log("drawGame");
            context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

            // context.canvas.height = TABLE_HEIGHT;
            // context.canvas.width = TABLE_WIDTH;

            // creates green table
            context.fillStyle = '#00A650';
            context.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

            context.fillStyle = '#FFFFFF';
            // net
            for (let i = 0; i < TABLE_WIDTH; i += 30) {
                context.fillRect(TABLE_WIDTH / 2, i, 2, 25);
            }
            // left player paddle
            context.fillRect(0, gameState.paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
            // right CPU paddle
            context.fillRect(TABLE_WIDTH - PADDLE_THICKNESS, gameState.paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
            // draws ball
            context.beginPath();
            context.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2, true);
            context.fill();

            // movement functions
            // ballMovement();
             computerMovement();
            // collision();
            animationFrameId = requestAnimationFrame(drawGame);
        };
        // const updateGame = () => {
        //     drawGame();
        //     requestAnimationFrame(updateGame);
        // };
        drawGame();
        if (player1Score === WINNING_SCORE || player2Score === WINNING_SCORE) setWinner(true);

        // player movement
        const updateMousePosition = event => {
            const rect = canvas.getBoundingClientRect();
            const newY = event.clientY - rect.top;
            //setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top })
            //if (mousePosition.y > 0 && mousePosition.y < TABLE_HEIGHT) setPaddle1Y(mousePosition.y - (PADDLE_HEIGHT / 2));
            emitPaddleMove(newY, roomId, role === 'creator' ? 'left' : 'right');
        };
        canvas.addEventListener('mousemove', updateMousePosition);
        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', updateMousePosition);
        };

    }, [gameState, roomId, role, emitPaddleMove]);

    return (
        <div className="container">
            {/* back button */}
            <div className="back">
                <Link to={`../Lobby`}><button className="button">Quit</button></Link>
            </div>
            <div className='score'>
                <h1>{gameState.player1Score}</h1>
                <h2 className='gameState.winner'> {winner ? 'Game over!' : ''} </h2>
                <h1>{gameState.player2Score}</h1>
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