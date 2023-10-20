import * as React from "react";
import * as ReactDOM from "react-dom/client";


import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import "./index.css";
import TitleScreen from "./TitleScreen";
import Gameplay from './Gameplay';

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
    path: "/Gameplay",
    element: <Gameplay />,
  },

]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);