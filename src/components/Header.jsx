import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext'; // Import useAuth

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth(); // Get auth context
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  
  // Hide header on auth pages where you don't want a header displayed
  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-[#071E26] border-b border-[#06303a] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> 
          {/* Logo area */}
          <div className="flex items-center gap-3"> 
            <button onClick={() => navigate('/home')} className="flex items-center gap-2 focus:outline-none">
              <img
                src="/logo.png"
                alt="Board Ease"
                className="w-12 h-auto rounded-full object-contain p-1"
                onError={(e) => { e.target.src = '../logo-picture/main-logo.jpg'; }}
              />
              <span className="text-white font-semibold tracking-wide hidden sm:inline">BOARD EASE</span>
            </button>
          </div>

          {/* Desktop / tablet nav */}
          <nav className="hidden md:flex items-center gap-4"> 
            <button onClick={() => navigate('/home')} className={`flex items-center gap-2 text-sm px-3 py-1 rounded ${isActive('/home') ? 'text-white bg-[#0b2f36]' : 'text-white hover:text-gray-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
              </svg>
              <span>Home</span>
            </button>
            <button onClick={() => navigate('/rooms')} className={`flex items-center gap-2 text-sm px-3 py-1 rounded ${isActive('/rooms') ? 'text-white bg-[#0b2f36]' : 'text-white hover:text-gray-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 11h16M4 15h16" />
              </svg>
              <span>Rooms</span>
            </button>
            <button onClick={() => navigate('/profile#my-bookings')} className={`flex items-center gap-2 text-sm px-3 py-1 rounded ${isActive('/bookings') ? 'text-white bg-[#0b2f36]' : 'text-white hover:text-gray-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
              </svg>
              <span>Bookings</span>
            </button>
            <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 text-sm px-3 py-1 rounded ${isActive('/profile') ? 'text-white bg-[#0b2f36]' : 'text-white hover:text-gray-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.12 17.804z" />
              </svg>
              <span>Profile</span>
            </button>
            {/* Updated Logout button */}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm px-3 py-1 rounded text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              <span>Logout</span>
            </button>
          </nav>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center"> 
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="p-2 rounded-md text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {open ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden bg-[#071E26] border-t border-[#06303a]"> 
          <div className="px-4 pt-4 pb-6 space-y-2">
            <button onClick={() => { setOpen(false); navigate('/home'); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${isActive('/home') ? 'text-white bg-[#0b2f36]' : 'text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
              </svg>
              <span>Home</span>
            </button>
            <button onClick={() => { setOpen(false); navigate('/rooms'); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${isActive('/rooms') ? 'text-white bg-[#0b2f36]' : 'text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 11h16M4 15h16" />
              </svg>
              <span>Rooms</span>
            </button>
            <button onClick={() => { setOpen(false); navigate('/profile#my-bookings'); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${isActive('/bookings') ? 'text-white bg-[#0b2f36]' : 'text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
              </svg>
              <span>Bookings</span>
            </button>
            <button onClick={() => { setOpen(false); navigate('/profile'); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${isActive('/profile') ? 'text-white bg-[#0b2f36]' : 'text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.12 17.804z" />
              </svg>
              <span>Profile</span>
            </button>
            {/* Updated mobile logout button */}
            <button onClick={() => { setOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 rounded flex items-center gap-2 text-red-400 hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
