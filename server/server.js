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
const WINNING_SCORE = 3;

let lobbies = [];
const gameStates = {};
const intervalIDs = {};

// Function to initiazlize the game for a new room
const initializeGameState = (roomId) => {
    gameStates[roomId] = {
        ballX: 500, // Center of the table
        ballY: 300,
        ballSpeedX: 15, // Initial ball speed
        ballSpeedY: 15,
        paddle1Y: 350, // Initial Y position of left paddle
        paddle2Y: 350, // Initial Y position of right paddle
        player1Score: 0, // Initial score for player 1
        player2Score: 0, // Initial score for player 2
        winner: false  // No winner at the start
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

// Function to update the game state for a room
const updateGameState = (roomId) => {
    const state = gameStates[roomId];
    if (!state) return;
    //console.log(`Updating game state for room: ${roomId}`); // Log for debugging

    // Update ball position
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    // Collision with top and bottom boundaries
    if (state.ballY < 0 || state.ballY > TABLE_HEIGHT) {
        state.ballSpeedY *= -1;
        //console.log('1')
    }

    // Left paddle
    if (state.ballX < 0 && state.ballY > state.paddle1Y - 30 && state.ballY < state.paddle1Y + PADDLE_HEIGHT + 40) {
        state.ballX += 20;
        //console.log('2')
        state.ballSpeedX *= -1;// Optionally modify ballSpeedY based on where it hit the paddle
    }
    // Right paddle
    if (state.ballX > TABLE_WIDTH && state.ballY > state.paddle2Y - 30 && state.ballY < state.paddle2Y + PADDLE_HEIGHT + 40) {
        state.ballX -= 20;
        //console.log('3')
        state.ballSpeedX *= -1;// Optionally modify ballSpeedY based on where it hit the paddle
    }

    // Score keeping
    if (state.ballX < 0) { // Ball passed left edge
        state.player2Score += 1;
        //console.log('4')
        if (state.player2Score >= WINNING_SCORE) state.winner = 'player2';
        resetBall(roomId);
    } else if (state.ballX > TABLE_WIDTH) { // Ball passed right edge
        state.player1Score += 1;
        //console.log('5')
        if (state.player1Score >= WINNING_SCORE) state.winner = 'player1';
        resetBall(roomId);
    }

    const sanitizedState = sanitizeGameState(state);
    // Emit the sanitized state
    io.to(roomId).emit('gameUpdate', sanitizedState);
};

const clientRooms = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    // Listen for joinRoom event from clients
    socket.on('joinRoom', (roomId) => {
        if (!gameStates[roomId]) {
            initializeGameState(roomId);
        }

        // Start the game loop
        socket.join(roomId);
        const sanitizedState = sanitizeGameState(gameStates[roomId]);
        socket.emit('gameUpdate', sanitizedState);

        let rooms = clientRooms.get(socket.id) || [];
        rooms.push(roomId);
        clientRooms.set(socket.id, rooms);

        // Set interval only if it doesn't already exist for the room
        if (!intervalIDs[roomId]) {
            gameStates[roomId].intervalId = setInterval(() => updateGameState(roomId), 1000 / 30);
        }
    });

    // Listen for paddle movement from clients
    socket.on('paddleMove', (data) => {
        const { y, roomId, paddle } = data;
        if (gameStates[roomId]) {
            if (paddle === 'left') {
                gameStates[roomId].paddle1Y = y;
            } else if (paddle === 'right') {
                gameStates[roomId].paddle2Y = y;
            }
        }
    });

    // Send the list of lobbies to the client
    //console.log(util.inspect(lobbies, { showHidden: false, depth: null }));
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
