require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');// Random id generator
const util = require('util');
const { act } = require('react');
const { read } = require('fs');
const { clear } = require('console');

const app = express();
const server = http.createServer(app);

// Determine the appropriate origin for CORS based on the environment
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://pingpong-ctp.herokuapp.com']
    : ['http://localhost:3000'];

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
    });
}

// Constants for game dimensions and other settings
const TABLE_WIDTH = 1000;
const TABLE_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_THICKNESS = 10;
const WINNING_SCORE = 5;

let lobbies = [];
const gameStates = {};
const intervalIDs = {};

// Function to initiazlize the game for a new room
const initializeGameState = (roomId, cpuMode = false, difficulty = "easy") => {
    return {
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
        waitingForPlayers: true, // Whether the game is waiting for players
        readyPlayers: new Set(), // Set of players ready to play
        rematchVotes: new Set(), // Set of players who voted for a rematch
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

    if (!gameStates[roomId]) {
        console.log("No existing game state found. Initializing game state for room:", roomId);
        gameStates[roomId] = initializeGameState(roomId, false); // Defaulting cpuMode to false if not specified
        if (gameStates[roomId]) {
            console.log("Game state successfully initialized for room:", roomId);
        } else {
            return; // Exit if state could not be initialized
        }
    }

    const state = gameStates[roomId];

    if (state.paused || state.winner) {
        return; // Skip update if game is paused or there is a winner
    }

    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    collision(state);

    if (state.cpuMode) {
        moveCPUPaddle(state, state.difficulty);
    }

    if (state.ballX < 0) {
        state.player2Score += 1;
        if (state.player2Score >= WINNING_SCORE) {
            state.winner = 'player2';
            console.log('Player 2 wins');
        }
        ballReset(state);
    } else if (state.ballX > TABLE_WIDTH) {
        state.player1Score += 1;
        if (state.player1Score >= WINNING_SCORE) {
            state.winner = 'player1';
            console.log('Player 1 wins');
        }
        ballReset(state);
    }

    io.to(roomId).emit('gameUpdate', sanitizeGameState(state));
};

// Move CPU Paddle based on difficulty
const moveCPUPaddle = (state) => {
    let speedModifier, accuracy;
    switch (state.difficulty) {
        case "easy":
            speedModifier = 1.0;
            accuracy = 0.7;
            break;
        case "normal":
            speedModifier = 1.2;
            accuracy = 0.6;
            break;
        case "hard":
            speedModifier = 1.5;
            accuracy = 0.5;
            break;
        default:
            speedModifier = 1.0;
            accuracy = 0.7;
    }

    const oldY = state.paddle2Y;
    const paddleCenter = state.paddle2Y + PADDLE_HEIGHT / 2;
    if (state.ballY > paddleCenter && Math.random() < accuracy) {
        state.paddle2Y = Math.min(state.paddle2Y + speedModifier * 10, TABLE_HEIGHT - PADDLE_HEIGHT); // Increase the speed modifier
    } else if (state.ballY < paddleCenter && Math.random() < accuracy) {
        state.paddle2Y = Math.max(state.paddle2Y - speedModifier * 10, 0);
    }
    //console.log(`CPU Paddle moved from ${oldY} to ${state.paddle2Y} using speed ${speedModifier} and accuracy ${accuracy}`);

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
const socketRooms = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    // Listen for joinRoom event from clients
    socket.on('joinRoom', (roomId, cpuMode = false) => {
        socket.join(roomId);

        if (!clientRooms.has(roomId)) {
            console.log(`Initializing new room with ID: ${roomId}`)
            const gameState = initializeGameState(roomId, cpuMode);
            clientRooms.set(roomId, {
                readyPlayers: new Set(),
                intervalID: null,
                cpuMode: cpuMode,
                gameStates: gameState,
            });
        }
        socketRooms[socket.id] = roomId;
        const room = clientRooms.get(roomId);
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        const playerNumber = roomSize === 1 ? 1 : 2;

        io.to(roomId).emit('playerCount', { count: roomSize });
        io.to(roomId).emit('gameUpdate', sanitizeGameState(room.gameStates));

        // Debugging: Log the joining details
        console.log(`Socket ${socket.id} joined room ${roomId} as player ${playerNumber}. Total in room: ${roomSize}`);
    });

    socket.on('playerReady', (roomId) => {
        console.log(`Player ${socket.id} pressed ready in room ${roomId}`);
        const room = clientRooms.get(roomId);

        if (room) {
            if (!room.readyPlayers.has(socket.id)) {
                room.readyPlayers.add(socket.id);
                console.log(`Player ${socket.id} added to ready players.`);
            } else {
                console.log(`Player ${socket.id} was already marked as ready.`);
            }

            console.log(`Players ready in room ${roomId}:`, Array.from(room.readyPlayers));
            const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            console.log(`Total players in room ${roomId}: ${roomSize}`);
            console.log(`Expected ready count: ${roomSize}, Actual ready count: ${room.readyPlayers.size}`);

            //Check if all players are ready
            if (room.readyPlayers.size === 2) {
                console.log("All players are ready in room:", roomId);

                if (!room.intervalID) {
                    io.to(roomId).emit('startCountdown');
                    console.log("Countdown started for room:", roomId);
                }
            }
        }
    });

    socket.on('initializeGameState', (roomId) => {
        gameStates[roomId] = initializeGameState(roomId);
        console.log(`Game state initialized for room ${roomId}`);
    });

    socket.on('startGame', (roomId) => {
        console.log("Received startGame request for roomId:", roomId);

        const room = clientRooms.get(roomId);
        if (room) {
            if (room.intervalID) {
                clearInterval(room.intervalID); // Ensure no duplicate intervals
            }
            console.log("Starting game for room:", roomId);
            room.intervalID = setInterval(() => updateGameState(roomId), 1000 / 40);
            room.gameStates.waitingForPlayers = false;
            io.to(roomId).emit('gameStarted');  // Notify all clients in the room that the game has started
        } else {
            console.log('Game start request ignored (already started or no room):', roomId);
        }
    });

    //Generate a roomId for a CPU game
    socket.on('startCPUGame', ({ difficulty }) => {
        const roomId = uuidv4() // Generate a unique room ID
        console.log(`Received start CPU game request with difficulty: ${difficulty}`);
        const gameState = initializeGameState(roomId, true, difficulty); // Initialize game state with CPU mode true
        gameStates[roomId] = gameState; // 'true' for cpuMode
        socket.join(roomId);
        socketRooms[socket.id] = roomId;
        clientRooms.set(roomId, {
            readyPlayers: new Set([socket.id]), // Automatically set this socket as ready
            intervalID: null,
            gameStates: gameState,
        });
        socket.emit('cpuGameStarted', { roomId });

        console.log(`CPU game started in room: ${roomId} with CPU mode status: ${gameStates[roomId].cpuMode}`);
    });

    // Listen for replay request
    socket.on('requestReplay', (roomId) => {
        console.log('Replay requested');
        if (gameStates[roomId]) {
            initializeGameState(roomId, gameStates[roomId].cpuMode); // Reinitialize the game state
            io.to(roomId).emit('gameUpdate', sanitizeGameState(gameStates[roomId])); // Broadcast updated state
        }
    });

    socket.on('rematchAccepted', (roomId) => {
        console.log('Rematch requested');
        const room = clientRooms.get(roomId);

        if (room) {
            room.gameStates.rematchVotes.add(socket.id);
            console.log(`Player ${socket.id} voted for a rematch in room ${roomId}. Total votes: ${room.gameStates.rematchVotes.size}`);
            if (room.gameStates.rematchVotes.size === 2) {
                console.log('All players voted for a rematch. Starting rematch.');
                clearInterval(room.intervalID);

                // Reset the game state
                room.gameStates = initializeGameState(roomId, room.gameStates.cpuMode, room.gameStates.difficulty);

                // Should start the Countdown 
                io.to(roomId).emit('rematchAccepted');// Broadcast rematch accepted
            }
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
        console.log(`Client disconnected: ${socket.id}`);
        const roomId = socketRooms[socket.id];
        console.log('roomId:', roomId);

        if (roomId) {
            const room = clientRooms.get(roomId);
            const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;

            console.log(`Player ${socket.id} disconnected from room ${roomId}. Room size: ${roomSize}`);

            if (room) {
                console.log(`Removing player ${socket.id} from room ${roomId}`)
                room.readyPlayers.delete(socket.id);

                if (room.readyPlayers.size < 2) {
                    clearInterval(room.intervalID);
                    room.intervalID = null;
                    room.gameStates.waitingForPlayers = true;
                    io.to(roomId).emit('stopCountdown');
                    io.to(roomId).emit('playerCount', { count: room.readyPlayers.size });
                }

                if (roomSize === 0) {
                    console.log(`No players in room ${roomId}. Deleting room.`);
                    clearInterval(room.intervalID);
                    delete gameStates[roomId];
                    clientRooms.delete(roomId);

                    // Remove the room from the lobbies list
                    lobbies = lobbies.filter(lobby => lobby.id !== roomId);
                    io.emit('updateLobbies', lobbies); // Update all clients with the new list of lobbies
                    console.log(`Room ${roomId} deleted and lobbies updated.`);
                }
            } else {
                console.log(`No player data found for disconnected socket: ${socket.id}`);
            }
        }
        // Remove the socket from the socketRooms object
        delete socketRooms[socket.id];
    });

});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
