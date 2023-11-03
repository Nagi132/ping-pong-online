const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

let lobbies = [];
console.log('Lobbies: ', lobbies);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', () => {
        // Send the list of lobbies to the client
        socket.emit('updateLobbies', lobbies);
    });

    socket.on('error', (err) => {
        console.error('Socket.IO error:', err);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Client disconnected, reason: ${reason}`);
    });

    const { v4: uuidv4 } = require('uuid');//random id generator
    // Listen for the createLobby event
    socket.on('createLobby', (lobbyName, callback) => {
        const lobbyId = uuidv4();
        console.log(`Lobby created: ${lobbyName}`);

        // Add the new lobby to the list of lobbies
        lobbies.push({ id: lobbyId, name: lobbyName });

        // Update all clients with the new list of lobbies
        io.emit('updateLobbies', lobbies);

        // Confirm to the client that created the lobby that it was created
        socket.emit('lobbyCreated', { id: lobbyId, name: lobbyName });

        if (lobbyId) {
            callback({ status: 'ok' });
        } else {
            callback({ status: 'error', message: 'Lobby not created' });
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
