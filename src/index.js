import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import TitleScreen from "./components/TitleScreen";
import Gameplay from './Gameplay';
import Lobby from './components/Lobby';
import GameplayMenu from "./GameplayMenu";
import io from 'socket.io-client';

const socket = io(process.env.NODE_ENV === 'production' ? 'https://ping-pong-online.vercel.app' : 'http://localhost:4000',
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

function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the server');
    });
    console.log('Connected to the server');
    socket.on('connect_error', (error) => {
      console.log('Connection Error from index.js:', error);
    });

    // Cleanup function for disconnecting from the server
    return () => {
      socket.disconnect();
    };
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <TitleScreen />,
    },
    {
      path: "/GameplayMenu",
      element: <GameplayMenu />,
    },
    {
      path: "/Gameplay/:playerName",//For multiplayer mode
      element: <Gameplay />,
    },
    {
      path: "/Gameplay",//For single player mode
      element: <Gameplay />,
    },
    {
      path: "/Lobby",
      element: <Lobby />,
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
}

// Get the root element from the document
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
