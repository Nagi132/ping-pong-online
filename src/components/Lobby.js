import React, { useState, useEffect } from 'react';
import './Lobby.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const {num} = require('./difiiculty.js');

function Lobby() {
    const location = useLocation();
    const navigate = useNavigate();
    const { username } = location.state || {};
    const [lobbies, setLobbies] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the socket.io server
        const newSocket = io('http://localhost:4000', {
            withCredentials: true,
            extraHeaders: {
                'my-custom-header': 'abcd'
            }
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join'); // Emit 'join' after the socket is connected
        });

        newSocket.on('updateLobbies', (lobbiesFromServer) => {
            setLobbies(lobbiesFromServer);
        });

        return () => {
            newSocket.off('updateLobbies');
            newSocket.close();
        };
    }, []);

    const handleCreateLobby = () => {
        console.log('Creating lobby for: ', username);
        const lobbyName = `${username}'s Lobby`;
        socket.emit('createLobby', lobbyName, (response) => {
            if (response.status === 'ok') {
                navigate(`/Gameplay/${response.lobbyId}`);
            } else {
                console.log('Error creating lobby: ', response.message);
            }
        });
    }
    const handle_VS_CPU = () => {
        console.log('Creating cpu game for: ', username);
        console.log('difficulty: ', num.dif);
        navigate(`/Gameplay/undefined`);
        
    }

    return (
        <div className="container-fluid mt-5">
            <div className="lobby-background">
                <header className="game-lobby-header">
                    <h1 className="game-lobby-title">GAME LOBBY</h1>
                </header>

                <div className="player-section">
                    <h2 className="lobby-list">LOBBY LIST:</h2>
                    <div className="player-container">
                        {lobbies.map((lobby) => (
                            <div key={lobby.id} className="player">
                                <Link to={`/Gameplay/${lobby.id}`}>{lobby.name}</Link>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="d-flex justify-content-between mt-5">
                    <Link to="/">
                        <button className="btn btn-home">HOME</button>
                    </Link>
                    <button className="btn btn-create-lobby" onClick={() => handleCreateLobby(username)}>
                        CREATE LOBBY
                    </button>
                </div>

                <div className="d-flex justify-content-between mt-5">
                    <div className="player-section">
                        <h2 className="lobby-list">VS CPU</h2>
                    </div>
                    <button className="btn btn-vsCPU" onClick={() =>  handle_VS_CPU(num.dif = 0)}>
                        CPU Easy
                    </button>
                    <button className="btn btn-vsCPU" onClick={() =>  handle_VS_CPU(num.dif = 1)}>
                        CPU Normal
                    </button>
                    <button className="btn btn-vsCPU" onClick={() =>  handle_VS_CPU(num.dif = 2)}>
                        CPU Hard
                    </button>
                </div>
                
            </div>
        </div>
    );
}

export default Lobby;
