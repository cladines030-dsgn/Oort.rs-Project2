import { createApplication } from "./app/createApplication";
import "./styles.css";

const appNode = document.querySelector<HTMLElement>("#app");

if (!appNode) {
  throw new Error("Unable to mount application: missing #app container");
}

createApplication(appNode);


import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
  