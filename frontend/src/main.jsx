import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./context/AuthContext.jsx";

// React Query defaults tuned for an IAM dashboard:
//  - 30s freshness window (data is "live enough")
//  - 5 min cache time
//  - retry once (don't hammer the backend during a hiccup)
//  - refetch on window focus → admin tabs feel real-time without WebSockets
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: "rgba(15, 18, 28, 0.92)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "10px 14px",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "#0b0f19" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#0b0f19" } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
