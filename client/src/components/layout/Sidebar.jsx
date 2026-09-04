import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">R</div>

        <div>
          <h2>Revenue Recovery</h2>
          <span>Operations</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-section-title">MONITORING</p>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>▦</span>
            Overview
          </NavLink>

          <NavLink
            to="/incidents"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◇</span>
            Incidents
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-section-title">RECOVERY</p>

          <NavLink
            to="/recovery"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>↻</span>
            Recovery
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-section-title">SYSTEM</p>

          <NavLink
            to="/system"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>◉</span>
            System
          </NavLink>

          <NavLink
            to="/revenue"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>₹</span>
            Revenue Operations
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>

        <div>
          <strong>System Operational</strong>
          <span>All systems monitored</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
