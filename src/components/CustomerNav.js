import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
const MapIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const ReceiptIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function CustomerNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const items = [
    { path: '/customer/browse', label: 'Browse', Icon: HomeIcon },
    { path: '/customer/map', label: 'Map', Icon: MapIcon },
    { path: '/customer/orders', label: 'My Orders', Icon: ReceiptIcon },
    { path: '/customer/profile', label: 'Profile', Icon: UserIcon },
  ];
  return (
    <nav className="navbar">
      {items.map(({ path, label, Icon }) => (
        <button key={path} className={`nav-item${loc.pathname === path ? ' active' : ''}`} onClick={() => nav(path)}>
          <Icon />
          <span className="nav-lbl">{label}</span>
        </button>
      ))}
    </nav>
  );
}
