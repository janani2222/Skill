import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Phase2Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="dashboard-layout"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="dashboard-main"><TopNav onToggleSidebar={() => setSidebarOpen((value) => !value)} />{children}</div></div>;
}
