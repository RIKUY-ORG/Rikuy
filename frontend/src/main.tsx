// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { RikuyPrivyProvider } from "./providers/privyProvider.tsx";
import { AvatarProvider } from "./context/avatarContext.tsx";
import { Provider } from "./providers/provider.tsx";
import { ToastProvider } from "@heroui/toast";
import { IdentityProvider } from "./context/identityContext"; // ← NUEVO
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RikuyPrivyProvider>
        <IdentityProvider>
          <AvatarProvider>
            <Provider>
              <ToastProvider placement="top-center" toastOffset={15} />
              <App />
            </Provider>
          </AvatarProvider>
        </IdentityProvider>
      </RikuyPrivyProvider>
    </BrowserRouter>
  </React.StrictMode>,
);