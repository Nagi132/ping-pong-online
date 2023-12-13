const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');// Random id generator
const util = require('util');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Constants for game dimensions and other settings
const TABLE_WIDTH = 1000;
const TABLE_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_THICKNESS = 10;
const WINNING_SCORE = 3;


let lobbies = [];
const gameStates = {};
const intervalIDs = {};

// Function to initiazlize the game for a new room
const initializeGameState = (roomId, cpuMode = false, difficulty = "easy") => {
    gameStates[roomId] = {
        ballX: 500, // Center of the table
        ballY: 300,
        ballSpeedX: 15, // Initial ball speed
        ballSpeedY: 15,
        paddle1Y: 350, // Initial Y position of left paddle
        paddle2Y: 350, // Initial Y position of right paddle
        player1Score: 0, // Initial score for player 1
        player2Score: 0, // Initial score for player 2
        winner: false,  // No winner at the start
        cpuMode: cpuMode, // Whether the game is in CPU mode
        difficulty: difficulty, // Difficulty of the CPU
    };
};

// Create a sanitized copy of the state to send
const sanitizeGameState = (state) => {
    return {
        ballX: state.ballX,
        ballY: state.ballY,
        ballSpeedX: state.ballSpeedX,
        ballSpeedY: state.ballSpeedY,
        paddle1Y: state.paddle1Y,
        paddle2Y: state.paddle2Y,
        player1Score: state.player1Score,
        player2Score: state.player2Score,
        winner: state.winner
    };
};

// Function to reset the ball position and speed
const resetBall = (roomId) => {
    const state = gameStates[roomId];
    if (!state) return;
    state.ballX = TABLE_WIDTH / 2;
    state.ballY = TABLE_HEIGHT / 2;
    state.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 15;
    state.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 15;
};

// Update game state
const updateGameState = (roomId) => {
    var hitCount = 0;
    const state = gameStates[roomId];
    if (!state || state.paused || state.winner) return; // Skip update if game is paused
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;
    // Ball movement
    // if (state.difficulty !== 'off') {
    //     state.ballX += state.ballSpeedX * state.speedModifier + state.hitCount / 4;
    //     state.ballY += state.ballSpeedY * state.speedModifier + state.hitCount / 4;
    // }

    // Handle collision
    collision(state);

    // CPU Paddle Movement
    if (state.cpuMode) {
        moveCPUPaddle(state);
    }

    // Scoring
    if (state.ballX < 0) { // Ball passed left edge
        state.player2Score += 1;
        if (state.player2Score >= WINNING_SCORE) {
            state.winner = 'player2';
            console.log('Player 2 wins');

        }
        ballReset(state);
    } else if (state.ballX > TABLE_WIDTH) { // Ball passed right edge
        state.player1Score += 1;
        if (state.player1Score >= WINNING_SCORE) {
            state.winner = 'player1';
            console.log('Player 1 wins');
        }
        ballReset(state);
    }

    // Emit the updated game state
    io.to(roomId).emit('gameUpdate', sanitizeGameState(state));
};

// Move CPU Paddle based on difficulty
const moveCPUPaddle = (state) => {
    let speedModifier, accuracy;
    switch (state.difficulty) {
        case "easy":
            speedModifier = 0.5; // increased from 0.3
            accuracy = 0.5; // increased from 0.3
            break;
        case "normal":
            speedModifier = 0.6; // increased from 0.43
            accuracy = 0.4; // increased from 0.2
            break;
        case "hard":
            speedModifier = 0.8; // increased from 0.7
            accuracy = 0.3; // increased from 0.1
            break;
        default:
            speedModifier = 0.5; // increased from 0.3
            accuracy = 0.5; // increased from 0.3
    }

    const paddleCenter = state.paddle2Y + PADDLE_HEIGHT / 2;
    if (state.ballY > paddleCenter && Math.random() < accuracy) {
        state.paddle2Y = Math.min(state.paddle2Y + speedModifier * 10, TABLE_HEIGHT - PADDLE_HEIGHT); // Increase the speed modifier
    } else if (state.ballY < paddleCenter && Math.random() < accuracy) {
        state.paddle2Y = Math.max(state.paddle2Y - speedModifier * 10, 0); // Increase the speed modifier
    }
};
// Collision function
const collision = (state) => {
    // Top and bottom boundary collision
    if (state.ballY < 0 || state.ballY > TABLE_HEIGHT) {
        state.ballSpeedY *= -1;
    }

    // Left paddle collision
    if (state.ballX < 0 && state.ballY > state.paddle1Y - 30 && state.ballY < state.paddle1Y + PADDLE_HEIGHT + 40) {
        state.ballX = 20;
        state.ballSpeedX *= -1;
        const deltaY = state.ballY - (state.paddle1Y + PADDLE_HEIGHT / 2);
        state.ballSpeedY = deltaY * (Math.random() < 0.5 ? -0.5 : 0.5);
    }

    // Right paddle collision
    if (state.ballX > TABLE_WIDTH && state.ballY > state.paddle2Y - 30 && state.ballY < state.paddle2Y + PADDLE_HEIGHT + 40) {
        state.ballX = TABLE_WIDTH - 20;
        state.ballSpeedX *= -1;
        const deltaY = state.ballY - (state.paddle2Y + PADDLE_HEIGHT / 2);
        state.ballSpeedY = deltaY * (Math.random() < 0.5 ? -0.5 : 0.5);
    }
};
// Reset ball
const ballReset = (state) => {
    if (!state) return;
    state.ballX = TABLE_WIDTH / 2;
    state.ballY = TABLE_HEIGHT / 2;
    state.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 15; // Randomize the direction
    state.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 15;
    state.hitCount = 0;
};

// Function to pause or resume the game
const togglePause = (roomId, pause) => {
    const state = gameStates[roomId];
    if (state) {
        state.paused = pause;
    }
}

const clientRooms = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    // Listen for joinRoom event from clients
    socket.on('joinRoom', (roomId, cpuMode = false) => {
        if (!gameStates[roomId]) {
            initializeGameState(roomId, cpuMode);
        }

        // Start the game loop
        socket.join(roomId);
        const sanitizedState = sanitizeGameState(gameStates[roomId]);
        socket.emit('gameUpdate', sanitizedState);

        let rooms = clientRooms.get(socket.id) || [];
        rooms.push(roomId);
        clientRooms.set(socket.id, rooms);

        // Listen for replay request
        socket.on('requestReplay', (roomId) => {
            console.log('Replay requested');
            if (gameStates[roomId]) {
                initializeGameState(roomId, gameStates[roomId].cpuMode); // Reinitialize the game state
                io.to(roomId).emit('gameUpdate', sanitizeGameState(gameStates[roomId])); // Broadcast updated state
            }
        });

        // Listen for pause request
        socket.on('togglePause', (roomId, pause) => {
            const state = gameStates[roomId];
            if (state) {
                state.paused = pause;
                io.to(roomId).emit('gameUpdate', sanitizeGameState(state));
            }
        });

        socket.on('changeDifficulty', (roomId, difficulty) => {
            if (gameStates[roomId]) {
                gameStates[roomId].difficulty = difficulty;
                console.log(`Difficulty set to ${difficulty} for room ${roomId}`);
            }
        });

        // Set interval only if it doesn't already exist for the room
        if (!intervalIDs[roomId]) {
            gameStates[roomId].intervalId = setInterval(() => updateGameState(roomId), 1000 / 40);
        }
    });

    // Listen for paddle movement from clients
    socket.on('paddleMove', (data) => {
        const { y, roomId, paddle } = data;
        // Ignore the event if roomId is undefined or invalid
        if (!roomId || !gameStates[roomId]) {

            return;
        }
        if (gameStates[roomId]) {

            if (paddle === 'left') {
                gameStates[roomId].paddle1Y = y;
            } else if (paddle === 'right') {
                gameStates[roomId].paddle2Y = y;
            }
        }
    });

    // Send the list of lobbies to the client
    socket.on('join', () => { socket.emit('updateLobbies', lobbies); });

    // Listen for the createLobby event
    socket.on('createLobby', (lobbyName, callback) => {
        const lobbyId = uuidv4();
        console.log(`Lobby created: ${lobbyName}`);
        lobbies.some(lobby => lobby.id === lobbyId) ?
            callback({ status: 'error', message: 'Lobby ID already exists' }) :
            (lobbies.push({ id: lobbyId, name: lobbyName }),
                io.emit('updateLobbies', lobbies),
                callback({ status: 'ok', id: lobbyId }));
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        let rooms = clientRooms.get(socket.id) || [];
        rooms.forEach(roomId => {
            // Remove the client from the room
            socket.leave(roomId);

            // Check if the room is empty
            const room = io.sockets.adapter.rooms.get(roomId);
            if (!room || room.size === 0) {
                // Clear the interval and delete game state if no more players
                clearInterval(intervalIDs[roomId]);
                delete intervalIDs[roomId];
                delete gameStates[roomId];
            }
        });
        clientRooms.delete(socket.id);

    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
