import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const ClipboardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>;
const WalletIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="17" cy="13" r="1"/></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>;

export default function RestaurantNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const items = [
    { path: '/restaurant/dashboard', label: 'Dashboard', Icon: HomeIcon },
    { path: '/restaurant/post', label: 'Post Item', Icon: PlusIcon },
    { path: '/restaurant/orders', label: 'Orders', Icon: ClipboardIcon },
    { path: '/restaurant/earnings', label: 'Earnings', Icon: WalletIcon },
    { path: '/restaurant/profile', label: 'Profile', Icon: SettingsIcon },
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
