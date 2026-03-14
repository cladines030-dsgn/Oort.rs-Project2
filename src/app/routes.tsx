import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Challenges } from "./pages/Challenges";
import { Game } from "./pages/Game";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/challenges",
    Component: Challenges,
  },
  {
    path: "/game",
    Component: Game,
  },
  {
    path: "/tutorial",
    Component: Game,
  },
  {
    path: "/multiplayer",
    Component: Game,
  },
]);