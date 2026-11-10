import { createRoot } from "react-dom/client";
import { worker } from "./mocks/browser"

import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Контейнер #root не найден");
}

worker.start()
  .then(() => {
    createRoot(container).render(<App />);
  })
  .catch((error: unknown) => {
    console.error(error);
    container.textContent = "Не удалось запустить демо.";
  });
