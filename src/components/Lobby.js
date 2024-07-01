import React, { useState, useEffect } from 'react';
import './Lobby.css';
import { Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const { num } = require('./difiiculty.js');

function Lobby() {
    const navigate = useNavigate();
    const [lobbies, setLobbies] = useState([]);
    const [socket, setSocket] = useState(null);

    // Retrieve the username from the location state or local storage
    const [username] = useState(localStorage.getItem('username') || ''); // Get the username from the location state


    useEffect(() => {
        // Connect to the socket.io server
        const newSocket = io(process.env.NODE_ENV === 'production' ? 'https://ping-pong-online.vercel.app/' : 'http://localhost:4000',
        {
            withCredentials: true,
            transportOptions: {
              polling: {
                extraHeaders: {
                  "my-custom-header": "abcd"
                }
              }
            }
          });
          console.log('Connected to the server2');

          newSocket.on('connect_error', (error) => {
            console.log('Connection Error from Lobby.js:', error);
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

    useEffect(() => {
        console.log('Setting username: ', username);
        localStorage.setItem('username', username);
    }, [username]);

    // Create a new lobby
    const handleCreateLobby = () => {
        if (!username.trim()) {
            console.log('Username is undefined. Cannot create lobby.');
            return;
        }
        num.dif = "online";
        console.log('Creating lobby for: ', username);
        const lobbyName = `${username}'s Lobby`;
        socket.emit('createLobby', lobbyName, (response) => {
            if (response.status === 'ok') {
                navigate(`/Gameplay/${response.id}`, { state: { role: 'creator' } });
            } else {
                console.log('Error creating lobby: ', response.message);
            }
        });
    }

    const handlePlayAgainstCPU = () => {
        num.dif = "off";
        const cpuGameId = "cpuMode";
        navigate('/Gameplay', { state: { mode: 'cpu', roomId: cpuGameId } });
        window.location.reload();
    }

    return (
        <div className="container-fluid mt-5">
            <div className="lobby-background">
                <header className="game-lobby-header">
                    <h1 className="game-lobby-title">GAME LOBBY</h1>
                </header>

                <div className="player-section">
                    <h2 className="lobby-list">Lobby list:</h2>
                    <div className="player-container">
                        {lobbies.map((lobby) => (
                            <div key={lobby.id} className="player">
                                <Link to={`/Gameplay/${lobby.id}`} state={{ role: 'joiner' }}>{lobby.name}</Link>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="justify-content-between top80">
                    <Link to="/">
                        <button className="btn">HOME</button>
                    </Link>
                    <button className="btn btn-red" onClick={() => handleCreateLobby(username)}>
                        CREATE LOBBY
                    </button>
                </div>
                <button className="btn btn-purple top90" onClick={handlePlayAgainstCPU}>
                    PLAY AGAINST CPU
                </button>

            </div>
        </div>
    );
}

export default Lobby;
