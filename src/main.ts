import { createRoot } from "react-dom/client";
import { createElement } from "react";
import App from "./app/App";
import "./styles.css";

const appNode = document.querySelector<HTMLElement>("#app");

if (!appNode) {
  throw new Error("Unable to mount application: missing #app container");
}

createRoot(appNode).render(createElement(App));
