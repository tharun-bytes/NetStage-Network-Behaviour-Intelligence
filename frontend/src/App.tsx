import React from "react";
import { AppProvider } from "./context/AppContext";
import { Shell } from "./components/layout/Shell";

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
