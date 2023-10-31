import * as React from "react";
import * as ReactDOM from "react-dom/client";

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import "./index.css";
import TitleScreen from "./components/TitleScreen";
import Gameplay from './Gameplay';
import Lobby from './components/Lobby';
import GameplayMenu from "./GameplayMenu";

const router = createBrowserRouter([
  //add more routes to pages here

  // {
  //   path: "/Root",
  //   element: <Root />,
  // },

  //default route "/" is titlescreen
  {
    path: "/",
    element: <TitleScreen />,
  },

  {
    path: "/GameplayMenu",
    element: <GameplayMenu />,
  },

  {
    path: "/Gameplay/:playerName",
    element: <Gameplay />,
  },

  {
    path: "/Lobby",
    element: <Lobby />,
  },

]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);