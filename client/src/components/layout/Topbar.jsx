const Topbar = () => {
  return (
    <header className="topbar">
      <div>
        <p className="topbar-label">REVENUE OPERATIONS</p>
        <h1>Payment Recovery Control Center</h1>
      </div>

      <div className="topbar-status">
        <span className="status-dot"></span>
        <span>Operational</span>
      </div>
    </header>
  );
};

export default Topbar;
