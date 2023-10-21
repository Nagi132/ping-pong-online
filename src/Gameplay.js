/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect } from 'react';
import { Outlet, Link } from "react-router-dom";
import './index.css';
import './Gameplay.css';

const Gameplay = props => {

    const canvasRef = useRef(null);  
    const TABLE_WIDTH = window.innerWidth/2 - 500;
    const TABLE_HEIGHT = window.innerHeight/2 - 300;
    // Varibales for ball and its speed
    let ballX = 500;
    //let ballSpeedX = 12.5;
    let ballY = 300;
    //let ballSpeedY = 10;

    // Variables for paddle
    let paddle1Y = 350;
    let paddle2Y = 350;
    const PADDLE_HEIGHT = 100;
    const PADDLE_THICKNESS = 10;

    // Scoring
    // let player1Score = 0;
    // let player2Score = 0;
    // const WINNING_SCORE = 3;
    // let winner = false;

     // Setting up ping pong table on canvas
    const tableSetup = (context) => {
        // green table
        colorRect(context, TABLE_WIDTH, TABLE_HEIGHT, 1000, 600,'#00A650');
        // net
        for(let i = TABLE_HEIGHT; i < window.innerHeight - TABLE_HEIGHT; i+=30){
            colorRect(context, TABLE_WIDTH+500, i, 2, 25, 'white');
        } 
    }

    const draw = (context) => {
        // this is left player paddle
        colorRect(context, TABLE_WIDTH, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT,'white');
        // this is right computer paddle
        colorRect(context, window.innerWidth-TABLE_WIDTH-PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT,'white');
        // draws ball
        colorCircle(context, TABLE_WIDTH+ballX, TABLE_HEIGHT+ballY, 10, 'white');
    }
  
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.canvas.height = window.innerHeight;
        context.canvas.width = window.innerWidth;

        tableSetup(context);
        draw(context);

    }, [draw, tableSetup])


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