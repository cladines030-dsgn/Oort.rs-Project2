import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Challenges } from "./pages/Challenges";
import { Game } from "./pages/Game";
import { Tutorial } from "./pages/Tutorial";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home
  },
  {
    path: "/tutorial",
    Component: Tutorial
  },
  {
    path: "/challenges",
    Component: Challenges
  },
  {
    path: "/game",
    Component: Game
  },
  {
    path: "/multiplayer",
    Component: Game
  }
]);
