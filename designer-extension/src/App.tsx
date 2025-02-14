import { useEffect, useState, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, Box } from "@mui/material";

import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { DevTools } from "./components/DevTools";
import { useAuth } from "./hooks/useAuth";
import { useSites } from "./hooks/useSites";
import { theme } from "./components/theme";
import "./App.css";

/**
 * App.tsx serves as the main entry point for the FlowSEO alt text generator.
 * Features:
 * 1. Authentication with Webflow's Designer API
 * 2. Site data fetching with React Query
 * 3. State management for user sessions
 * 4. Development tools for testing
 */

function AppContent() {
  const [hasClickedFetch, setHasClickedFetch] = useState(false);
  const { data: authState, exchangeAndVerifyIdToken, logout } = useAuth();
  const { sites, isLoading, isError, error, fetchSites } = useSites(
    authState?.sessionToken || "",
    hasClickedFetch
  );

  // Track if we've checked for stored auth token
  const hasCheckedToken = useRef(false);

  useEffect(() => {
    // Set the extension size to large
    webflow.setExtensionSize("large");

    // Only run auth flow if not already checked
    if (!hasCheckedToken.current) {
      const storedUser = localStorage.getItem("wf_hybrid_user");
      const wasExplicitlyLoggedOut = localStorage.getItem(
        "explicitly_logged_out"
      );

      if (storedUser && !wasExplicitlyLoggedOut) {
        exchangeAndVerifyIdToken();
      }
      hasCheckedToken.current = true;
    }

    // Handle the authentication complete event
    const handleAuthComplete = async (event: MessageEvent) => {
      if (event.data === "authComplete") {
        localStorage.removeItem("explicitly_logged_out");
        await exchangeAndVerifyIdToken();
      }
    };

    // Add the event listener for the authentication complete event
    window.addEventListener("message", handleAuthComplete);
    return () => {
      window.removeEventListener("message", handleAuthComplete);
      // Reset the check on unmount so it can run again if needed
      hasCheckedToken.current = false;
    };
  }, [exchangeAndVerifyIdToken]);

  // Handle the fetch sites button click
  const handleFetchSites = () => {
    setHasClickedFetch(true);
    fetchSites();
  };

  return (
    <BrowserRouter>
      <Box sx={{ 
        height: '100vh',
        width: '100vw',
        m: 0,
        p: 0,
        overflow: 'hidden'
      }}>
        {authState?.sessionToken ? (
          <Dashboard
            user={authState.user}
            sites={sites}
            isLoading={isLoading}
            isError={isError}
            error={error?.message || ""}
            onFetchSites={handleFetchSites}
          />
        ) : (
          <AuthScreen onAuth={() => {}} />
        )}
      </Box>
      <DevTools logout={logout} setHasClickedFetch={setHasClickedFetch} />
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
