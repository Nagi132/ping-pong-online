import React from 'react';
import './Lobby.css';
import { Link } from 'react-router-dom';

function Lobby() {
    // This is just a placeholder.
    const players = ['Player1', 'Player2', 'Player3'];

    return (
        <div className="container-fluid mt-5">
            <div className="lobby-background">
                <header className="game-lobby-header">
                    <h1 className="game-lobby-title">GAME LOBBY</h1>
                </header>

                <div className="player-section">
                    <h2 className="lobby-list">LOBBY LIST:</h2>
                    <ul>
                        {players.map(player => (
                            <li key={player}>
                                <Link to={'/Gameplay/${player}'}>{player}'s Lobby</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="d-flex justify-content-between mt-5">
                    <Link to="/">
                        <button className="btn btn-primary">HOME</button>
                    </Link>
                    <button className="btn btn-success">CREATE LOBBY</button>
                </div>
            </div>
        </div>
    );
}

export default Lobby;
