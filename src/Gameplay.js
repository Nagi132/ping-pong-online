import React, { useEffect, useRef, useState, useLayoutEffect, startTransition } from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import { debounce } from 'lodash';
import io from 'socket.io-client';
import './index.css';
import './Gameplay.css';
import { is } from '@babel/types';

const { num } = require('./components/difiiculty.js');

//stores difficulty setting temporarily for pause feature
var temp = "";

//keeps count for countdown 
// const startingSeconds = 5;
// var time = 0;

//boolean for if the game is paused or not
var paused = false;

//visibility of buttons
//var visible = true;

//amount of times ball was hit off of a paddle
var hitCount = 0;

const Gameplay = () => {
    const [time, setTime] = useState(5);
    const [visible, setVisible] = useState(true);
    const [gameActive, setGameActive] = useState(false);
    const [countdownActive, setCountdownActive] = useState(false);

    const location = useLocation(); // get mode from lobby
    const { role } = location.state || 'joiner';//default to joiner
    const mode = location.state?.mode || 'multiplayer';//default to multiplayer
    const roomId = location.pathname.split('/')[2];//get the room id from the url
    const [isCPUmode, setIsCPUMode] = useState(mode === 'cpu');

    const socket = useRef();// socket connection
    const canvasRef = useRef();// set up canvas 

    const [gameState, setGameState] = useState({
        ballX: 500, ballY: 300, paddle1Y: 350, paddle2Y: 350,
        player1Score: 0, player2Score: 0, winner: false
    });

    useEffect(() => {
        const countdownInterval = setInterval(updateCountdown, 1000);
        return () => clearInterval(countdownInterval); // Clear interval on component unmount
    }, []);

    //Visibility on difficulty buttons
    useEffect(() => {
        document.addEventListener('keydown', detectKeyDown, true)
    }, [])

    const detectKeyDown = (e) => {
        console.log("key clicked " + e.key);
        console.log("pausing game now");
        handlePause();
    }

    useEffect(() => {
        socket.current = io('http://localhost:4000');
        console.log("Mode in useEffect:", mode);
        socket.current.emit('joinRoom', roomId, isCPUmode);
        socket.current.on('gameUpdate', (newGameState) => {
            setGameState(newGameState);
            if (newGameState.player1Score >= WINNING_SCORE || newGameState.player2Score >= WINNING_SCORE) {
                console.log("Setting winner to true");
                setWinner(true); // Set winner to true to show the replay button
            }
        });

        return () => {
            socket.current.disconnect();
            socket.current.off('gameUpdate');
        };
    }, [roomId, isCPUmode]);

    function updateCountdown() {
        setTime(currentTime => {
            if (currentTime > 1) {
                setVisible(false); // Hide the buttons as countdown proceeds
                return currentTime - 1;
            } else {
                // Countdown has finished, start the game
                //setVisible(false); // Make buttons visible again
                num.dif = temp; // Set the difficulty
                setGameActive(true); // Activate the game
                //setCountdownActive(false); // Deactivate the countdown
                return 0; // Reset countdown
            }
        });
    }

    const activateCountdown1 = () => {
        setVisible(false); // Hide difficulty buttons during countdown
        setGameActive(false);
        setTime(5);
        temp = "easy";
        setCountdownActive(true);
    }
    const activateCountdown2 = () => {
        setVisible(false); // Hide difficulty buttons during countdown
        setGameActive(false);
        setTime(5);
        temp = "normal";
        setCountdownActive(true);
    }
    const activateCountdown3 = () => {
        setVisible(false); // Hide difficulty buttons during countdown
        setGameActive(false);
        setTime(5);
        temp = "hard";
        setCountdownActive(true);
    }

    // Debounced function for emitting paddle movements
    const emitPaddleMove = useRef(debounce((y, roomId, paddle) => {
        console.log("Emitting Paddle Move:", { y, roomId, paddle });
        if (isCPUmode && paddle === 'right') {
            // In CPU mode, do not emit movements for the right paddle
            return;
        }
        socket.current.emit('paddleMove', { y, roomId, paddle });
    }, 5)).current;

    // Event listener for mouse movement
    useEffect(() => {
        const handleMouseMove = (event) => {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const newY = Math.max(0, Math.min(event.clientY - rect.top - PADDLE_HEIGHT / 2, TABLE_HEIGHT - PADDLE_HEIGHT));

                if (!isCPUmode) {
                    emitPaddleMove(newY, roomId, role === 'creator' ? 'left' : 'right');
                } else {
                    // Directly update the paddle position in CPU mode
                    setPaddle1Y(newY);
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [isCPUmode, emitPaddleMove, roomId, role]);


    // set replay button
    const buttonReplay = useRef();

    // frame counter
    const [counter, setCounter] = useState(0);

    // table width and height
    const TABLE_WIDTH = 1000;
    const TABLE_HEIGHT = 600;


    //ball speed and cpu speed modifier for difficulties
    var speedModifier = 0;
    var accuracy = 0;

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
        if (num.dif != "off") {
            setBallX(x => x += ballSpeedX * speedModifier + hitCount / 4);
            setBallY(y => y += ballSpeedY * speedModifier + hitCount / 4);
        }
    };
    const collision = () => {
        console.log("collision in gameplay");
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
            hitCount++;
        }
        //when ball collides with player, same logic as cpu collision 
        else if (ballX < 0 && ballY > paddle1Y - 30 && ballY < paddle1Y + PADDLE_HEIGHT + 40) {
            setBallX(x => x + 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));

            hitCount++;
        }

        //when ball reaches left or right edge, add a point and reset
        else if (ballX < 0) {
            setPlayer2Score(s => s + 1);
            ballReset();
            hitCount = 0;
        }
        else if (ballX > TABLE_WIDTH) {
            setPlayer1Score(s => s + 1);
            ballReset();
            hitCount = 0;
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
            // Check which difficulty is selected and adjust the CPU paddle movement accordingly
            switch (num.dif) {
                case "easy":
                    moveCPUPaddle(0.3, 0.3); // Lower speed and accuracy for easy mode
                    break;
                case "normal":
                    moveCPUPaddle(0.43, 0.2); // Medium speed and accuracy for normal mode
                    break;
                case "hard":
                    moveCPUPaddle(0.7, 0.1); // Higher speed and accuracy for hard mode
                    break;
                default:
                    // Default behavior if no difficulty is selected
                    moveCPUPaddle(0.3, 0.3); // You can adjust these values as needed
            }
        }
    };

    const moveCPUPaddle = (speedModifier, accuracy) => {
        // Implement the logic to move the CPU paddle based on the ball's position and the given speed and accuracy
        const paddleCenter = paddle2Y + PADDLE_HEIGHT / 2;
        if (ballY > paddleCenter && Math.random() < accuracy) {
            setPaddle2Y(y => Math.min(y + speedModifier * 5, TABLE_HEIGHT - PADDLE_HEIGHT));
        } else if (ballY < paddleCenter && Math.random() < accuracy) {
            setPaddle2Y(y => Math.max(y - speedModifier * 5, 0));
        }
    };


    const replay = () => {
        if (winner) {

            setPlayer1Score(0);
            setPlayer2Score(0);
            setWinner(false);
            num.dif = "off";
            if (temp == "easy") {
                activateCountdown1();
            }
            if (temp == "normal") {
                activateCountdown2();
            }
            if (temp == "hard") {
                activateCountdown3();
            }
            socket.current.emit('requestReplay', roomId);
        }

    };

    const replayChangeDif = () => {
        if (winner) {
            setPlayer1Score(0);
            setPlayer2Score(0);
            setWinner(false);
            num.dif = "off";
            setVisible(false);
            socket.current.emit('requestReplay', roomId);
        }
    }

    const handlePause = () => {
        paused = !paused;
        console.log("paused " + paused);

        //unpaused
        if (!paused) {
            if (temp == "easy") {
                activateCountdown1();
            }
            if (temp == "normal") {
                activateCountdown2();
            }
            if (temp == "hard") {
                activateCountdown3();
            }

            console.log("num" + num.dif);
            console.log("temp" + temp);

        }
        //paused
        else {
            temp = num.dif;
            num.dif = "off";
            console.log("temp" + temp);
            console.log("num" + num.dif);
        }
        // Send pause/resume signal to server
        socket.current.emit('togglePause', roomId, paused);

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
        const canvas = canvasRef.current;
        if (!canvas || !gameActive) return;
        const context = canvas.getContext('2d');

        canvas.width = TABLE_WIDTH;
        canvas.height = TABLE_HEIGHT;

        let animationFrameId;

        //function to draw the game
        const drawGame = () => {
            context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            const leftPaddleY = isCPUmode ? paddle1Y : gameState.paddle1Y;

            // creates green table
            context.fillStyle = '#00A650';
            context.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

            context.fillStyle = '#FFFFFF';
            // net
            for (let i = 0; i < TABLE_WIDTH; i += 30) {
                context.fillRect(TABLE_WIDTH / 2, i, 2, 25);
            }
            // left player paddle
            context.fillRect(0, leftPaddleY, PADDLE_THICKNESS, PADDLE_HEIGHT);
            // right CPU paddle
            context.fillRect(TABLE_WIDTH - PADDLE_THICKNESS, gameState.paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT);
            // draws ball
            context.beginPath();
            context.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2, true);
            context.fill();

            animationFrameId = requestAnimationFrame(drawGame);
        };

        drawGame();
        if (player1Score === WINNING_SCORE || player2Score === WINNING_SCORE) setWinner(true);

        // player movement
        const updateMousePosition = event => {
            console.log("updateMousePosition");
            const rect = canvas.getBoundingClientRect();
            const newY = event.clientY - rect.top;
            const adjustedY = Math.max(0, Math.min(newY - PADDLE_HEIGHT / 2, TABLE_HEIGHT - PADDLE_HEIGHT));
            if (!isCPUmode) {
                // In multiplayer mode, emit paddle movement to the server
                emitPaddleMove(newY, roomId, role === 'creator' ? 'left' : 'right');
            } else {
                // In CPU mode, directly update the paddle position without emitting to the server
                setPaddle1Y(adjustedY);
            }
        };
        canvas.addEventListener('mousemove', updateMousePosition);
        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', updateMousePosition);
        };

    }, [gameState, paddle1Y, roomId, role, emitPaddleMove, isCPUmode, gameActive]);


    // Create a new lobby
    //accuracy: how random cpu paddle can be
    //speedModifier: ball and cpu paddle speed
    //dif1-3 are easy to hard
    const dif1 = () => {
        visible = !visible;
        num.dif = "easy";
        console.log('Creating cpu difficulty: ', num.dif);

        speedModifier = 0.30;
        accuracy = 0.3;
        // Inform server about difficulty change
        socket.current.emit('changeDifficulty', roomId, 'easy');

    };
    const dif2 = () => {
        visible = !visible;
        num.dif = "normal";
        console.log('Creating cpu difficulty: ', num.dif);

        speedModifier = 0.43;
        accuracy = 0.2;
        // Inform server about difficulty change
        socket.current.emit('changeDifficulty', roomId, 'normal');
    };
    const dif3 = () => {
        visible = !visible;
        num.dif = "hard";
        console.log('Creating cpu difficulty: ', num.dif);

        speedModifier = 0.7;
        accuracy = 0.1;
        // Inform server about difficulty change
        socket.current.emit('changeDifficulty', roomId, 'hard');
    };

    return (
        <div className="container">

            {/* back button */}
            <div className="back">
                {/* testing buttons */}
                <div className="d-flex justify-content-between mt-5"></div>
                <Link to={`../Lobby`}><button className="btn btn-red">Quit</button></Link>
                <Link to="/">
                    <button className="btn btn-home">HOME</button>
                </Link>

                {/* Difficulty Buttons: Only show when in CPU mode */}
                {isCPUmode && !gameActive && visible && (
                    <div>
                        <header className="game-lobby-header">
                            <h1 className="game-lobby-title">Choose a difficulty</h1>
                        </header>
                        <button className="btn btn-green" onClick={activateCountdown1()}>Easy</button>
                        <button className="btn btn-orange" onClick={activateCountdown2()}>Normal</button>
                        <button className="btn btn-red" onClick={activateCountdown3()}>Hard</button>
                        <p>(Press any button to pause the game)</p>
                    </div>
                )}
            </div>

            {/* countdown */}
            {!gameActive && time > 0 && (
                <div className="centered">
                    <p id='countdown'>{time}</p>
                </div>
            )}

            <div className='score'>
                <h1>{gameState.player1Score}</h1>
                <h2 className='gameState.winner'> {winner ? 'Game over!' : ''} </h2>
                <h1>{gameState.player2Score}</h1>
            </div>

            {/* gameplay */}
            {gameActive && (
                <div className="canvas-container">
                    <canvas ref={canvasRef} />
                </div>
            )}

            {/* replay buttons */}
            <div className="d-flex justify-content-between mt-5">
                {winner && <button className='btn btn-green' onClick={replay} ref={buttonReplay}>Replay?</button>}
                {winner && <button className='btn btn-orange' onClick={replayChangeDif} ref={buttonReplay}>Change Difficulty</button>}

            </div>

            {/* pause buttons */}
            <div className=" justify-content-between mt-5">
                {num.dif != "online"
                    && !paused
                    && <button className='btn btn-purple lowered' onClick={handlePause} ref={buttonReplay}>| |</button>}
            </div>
            <div className=" justify-content-between mt-5">
                {num.dif != "online"
                    && paused
                    && <button className='btn btn-purple lowered' onClick={handlePause} ref={buttonReplay}>resume</button>}
            </div>
        </div>
    );
}

export default Gameplay;