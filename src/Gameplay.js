
import React, { useEffect, useRef, useState, useLayoutEffect, startTransition } from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const {num} = require('./components/difiiculty.js');



//stores difficulty setting temporarily for pause feature
var temp = "";


//keeps count for countdown 
const startingSeconds = 5;
var time = 0;

//boolean for if the game is paused or not
var paused = false;

//finds tag named 'countdown'
//changes the text inside countdown to time - 1 if timer is not 0

function activateCountdown1(){
    time = startingSeconds;
    temp = "easy";
}
function activateCountdown2(){
    time = startingSeconds;
    temp = "normal";
}
function activateCountdown3(){
    time = startingSeconds;
    temp = "hard";
}
function updateCountdown(){
    const countdownEl = document.getElementById('countdown');
    time--;

    if(countdownEl && time > 0){
        visible = false;
        countdownEl.innerHTML = `${time}`;
        console.log(time);
        console.log("temp " + temp);
        console.log("dif " + num.dif);
        

    }
    if(time == 0){
        
        num.dif = temp;
        console.log("dif " + num.dif);

    }   
}



//visibility of buttons
var visible = true;

//runs countdown every 600/1000th of a second
setInterval(updateCountdown, 600); 
    
//amount of times ball was hit off of a paddle
var hitCount = 0;


const Gameplay = () => {

    

    //Visibility on difficulty buttons
   
    useEffect(() => {
        document.addEventListener('keydown', detectKeyDown, true)
    }, [])
    
    const detectKeyDown = (e) => {
        console.log("key clicked " + e.key);
        console.log("pausing game now");
        handlePause();
    }
    //boolean for timer being visible
    const [timerVisible, setTimerVisible] = useState(false);

  

    

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
    
    var speedModifier = 0;
    var accuracy = 0;

    if(num.dif == "easy") {
        speedModifier = 0.30;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.3;
    }
       
    else if(num.dif == "normal") {
        speedModifier = 0.43;
        //cpu paddle accuracy (chance it will move)
        accuracy = 0.2;
    }
    if(num.dif == "hard") {
        speedModifier = 0.7;
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
       if(num.dif != "off"){
            setBallX(x => x += ballSpeedX * speedModifier + hitCount / 4);
            setBallY(y => y += ballSpeedY * speedModifier + hitCount / 4); 
       } 
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
            hitCount++;
        }
        //when ball collides with player, same logic as cpu collision 
        else if (ballX < 0 && ballY > paddle1Y - 30 && ballY < paddle1Y+PADDLE_HEIGHT + 40) {
            setBallX(x => x + 20);
            setBallSpeedX(speedX => speedX * -1);
            let deltaY = ballY - (paddle1Y+PADDLE_HEIGHT/2);
            setBallSpeedY(deltaY * (Math.random() < 0.5 ? -.5 : .5));

            hitCount++;
        }

        //when ball reaches left or right edge, add a point and reset
        else if (ballX < 0){
            setPlayer2Score(s => s + 1);
            ballReset();
            hitCount = 0;
            // `while(hitCount = 0){
            //     const tempX = ballSpeedX;
            //     setBallSpeedX(10);
            //     setBallSpeedY(3 * (Math.random() < 0.5 ? -.5 : .5));
            // }`
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
        if (isCPUmode && (num.dif == "easy" || num.dif == "normal" || num.dif == "hard")) {
                //if ball is coming towards the cpu paddle, and after a set distance. This is usually when a human would move their paddle
            if(ballSpeedX >= 0 && ballX > 150){  
                //if the ball speed is really low a human being is more likely to track it, so random is set lower and speed is higher
                if(paddle2Y + 50 + 50  < ballY && Math.abs(ballSpeedY) < 10) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * speedModifier + 0.2 / (1 + (0.2*Math.random())));
                if(paddle2Y + 50 - 50  > ballY && Math.abs(ballSpeedY) < 10) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * 3 * -speedModifier + 0.2 / (1 + (0.2*Math.random())));

                //paddle2Y + 50 is the center of the paddle, once the ballY is passed either edge of the paddle, adjust paddleY
                //to be within the edges of the paddle
                //if 
                if(paddle2Y + 50 + 50  < ballY && Math.random() > accuracy) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY) * speedModifier + 0.2 / (1 + (accuracy *Math.random() + speedModifier)));
                if(paddle2Y + 50 - 50  > ballY && Math.random() > accuracy) 
                setPaddle2Y(y => y += Math.abs(ballSpeedY)  * -speedModifier + 0.2 / (1 + (accuracy *Math.random() + speedModifier)));
                
                

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
            num.dif = "off";
            if(temp == "easy"){
                activateCountdown1();
            }
            if(temp == "normal"){
                activateCountdown2();
            }
            if(temp == "hard"){
                activateCountdown3();
            }
            
        }
    }

    const replayChangeDif = () => {
        if (winner) {
            setPlayer1Score(0);
            setPlayer2Score(0);
            setWinner(false);
            num.dif = "off";
            visible = !visible;
        }
    }

    const handlePause = () => {
        paused = !paused;
        console.log("paused " + paused);
        
        //unpaused
        if(!paused){
            if(temp == "easy"){
                activateCountdown1();
            }
            if(temp == "normal"){
                activateCountdown2();
            }
            if(temp == "hard"){
                activateCountdown3();
            }
            
            console.log("num" + num.dif);
            console.log("temp" + temp);
            
        }
        //paused
        else{
            

            temp = num.dif; 
            num.dif = "off";
            console.log("temp" + temp);
            console.log("num" + num.dif);
        }
    }

    //testing pause button activated by keypress
    // useEffect(() => {
    //     function handleKeyDown(e) {
    //       console.log(e.keyCode);
    //     }
    
    //     document.addEventListener('keydown', handleKeyDown);
    
    //     // Don't forget to clean up
    //     return function cleanup() {
    //       document.removeEventListener('keydown', handleKeyDown);
    //     }
    //   }, []);
    

    
    

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
            if(num.dif != "off"){
                let rect = canvas.getBoundingClientRect();
            setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top })
            if (mousePosition.y > 0 && mousePosition.y < TABLE_HEIGHT) setPaddle1Y(mousePosition.y - (PADDLE_HEIGHT / 2));
            }
            
        };
        canvas.addEventListener('mousemove', updateMousePosition);
        return () => {
            canvas.removeEventListener('mousemove', updateMousePosition);
        };

    }, [counter])


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

    };
    const dif2 = () => {
        visible = !visible;
        num.dif = "normal";
        console.log('Creating cpu difficulty: ', num.dif);

        speedModifier = 0.43;
        accuracy = 0.2;
    };
    const dif3 = () => {
        visible = !visible;
        num.dif = "hard";
        console.log('Creating cpu difficulty: ', num.dif);

        speedModifier = 0.7;
        accuracy = 0.1;
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
                <div className="d-flex justify-content-between mt-5">
                    <header className="game-lobby-header">
                    {visible && (
                        <h1 className="game-lobby-title">Choose a difficulty</h1>
                    )}
                    </header>
                    
                    <br></br>
                    
                    {/* difficulty buttons */}
                    {visible && (
                        <button className="btn btn-green" onClick={activateCountdown1}>Easy</button>)
                    }
                   
                    {visible && (
                        <button className="btn btn-orange" onClick={activateCountdown2}>Normal</button>)
                    } 
                    {visible && (
                        <button className="btn btn-red" onClick={activateCountdown3}>Hard</button>)
                    }
                    
                    
                </div>
                {visible && (
                        <p>(Press any button to pause the game)</p>)
                    }
            </div>

            <div className='score'>
                <h2>{player1Score}</h2>
                <h2 className='winner'> {winner ? 'Game over!' : ''} </h2>
                <h2>{player2Score}</h2>
            </div>
            {/* gameplay */}
            <div className="canvas-container">
                <canvas ref={canvasRef} />
            </div>
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

            {/* countdown */}
                {num.dif == "off" 
                    && (time > 0)
                
                    && <div className="centered">
                            <p id='countdown'>5</p> 
                       </div>
                }
                
        </div>
    );
}

export default Gameplay;