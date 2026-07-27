import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import LoginForm from "./components/login-form.tsx";
import RegisterForm from "./components/register-form.tsx";
import KanbanBoard from "./components/kanban-board.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route>
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
        </Route>

        <Route path="/board/:boardId" element={<KanbanBoard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
