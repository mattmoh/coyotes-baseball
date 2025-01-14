import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Coyotes from './assets/coyotes.png';
import './App.css';
import Stats from './pages/Stats';
import Photos from './pages/Photos';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import ical from 'ical';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData, error } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (error) {
        console.error('Error fetching user role in getSession:', error);
      } else {
        setUserRole(userData.role);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch session and role once
    getSession();
  
    // Handle auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const fetchUserRole = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: userData, error } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (error) {
            console.error('Error fetching user role in useEffect:', error);
          } else {
            setUserRole(userData.role);
          }
        };
        fetchUserRole();
      } else {
        setUserRole(null);
      }
    });
  
    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe(); // Clean up listener
      }
    };
  }, [getSession]); // Dependency array ensures this only runs once

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_GC_CALENDAR);
        const data = await response.text();
        const parsedData = ical.parseICS(data);
        const events = Object.values(parsedData).filter(event => event.type === 'VEVENT');
        const upcomingEvents = events.filter(event => new Date(event.start) > new Date());
        upcomingEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        setNextEvent(upcomingEvents[0]);
      } catch (error) {
        console.error('Error fetching calendar:', error);
      }
    };

    fetchCalendar();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      setSession(null);
      setUserRole(null);
      window.location.href = '/';
    }
  };

  const handleAuthChange = (isAuthenticated) => {
    if (isAuthenticated) {
      getSession();
    }
  };

  return (
    <>
      <div className="header">
        <img src={Coyotes} className="logo" alt="Coyotes" />
        <h1>Skokie Coyotes 8U</h1>
      </div>
      <div className="next-event">
        {nextEvent ? (
          <>
            <h2>Next Event</h2>
            <p>{nextEvent.summary}</p>
            <p>{new Date(nextEvent.start).toLocaleString()}</p>
          </>
        ) : (
          <p>Loading next event...</p>
        )}
      </div>
      <Router>
        <AppRoutes 
          session={session} 
          userRole={userRole} 
          handleLogout={handleLogout} 
          handleAuthChange={handleAuthChange} 
        />
      </Router>
    </>
  );
}

const AppRoutes = ({ session, userRole, handleLogout, handleAuthChange }) => {
  const navigate = useNavigate();

  if (!session) {
    return <Auth onAuthChange={handleAuthChange} />;
  }

  if (session && !userRole) {
    return <div>Loading...</div>; // Optional loading state while role is fetched
  }

  return (
    <>
      <div className="button-container">
        <button onClick={() => navigate('/stats')}>Stats</button>
        <button onClick={() => navigate('/photos')}>Photos</button>
        {userRole === 'coach' && <button onClick={() => navigate('/admin')}>Admin</button>}
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/stats" />} />
        <Route
          path="/stats"
          element={userRole === 'coach' || userRole === 'parent' ? <Stats /> : <Navigate to="/" />}
        />
        <Route
          path="/photos"
          element={userRole === 'coach' || (userRole === 'parent' && session.user.player_id) ? <Photos /> : <Navigate to="/" />}
        />
        <Route path="/admin" element={userRole === 'coach' ? <Admin /> : <Navigate to="/" />} />
        {/* Add more routes here */}
      </Routes>
      <div className="button-container">
      {session && <button onClick={handleLogout}>Log Out</button>}
      </div>
    </>
  );
}

export default App;