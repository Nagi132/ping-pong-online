import './TitleScreen.css';
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

function TitleScreen() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate(); // Hook for programmatic navigation

  const handlePlay = () => {
    if (username) {
      localStorage.setItem("username", username); // Save username to local storage
      navigate("/Lobby", { state: { username } }); // Pass username to Lobby
    } else {
      alert("Please enter a username.");
    }
  };

  return (
      <div className="title-screen">
        <div className="App-background">
          <div className="App-header">
            <label htmlFor="username">Enter Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <button className="button" onClick={handlePlay}>Play!</button>
          </div>
        </div>
      </div>
  );
}

export default TitleScreen;
