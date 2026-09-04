import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Recovery from "./pages/Recovery";
import System from "./pages/System";
import Revenue from "./pages/Revenue";

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Topbar />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/system" element={<System />} />
            <Route path="/revenue" element={<Revenue />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
