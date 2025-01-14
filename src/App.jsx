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
import ICAL from "ical.js";

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
        subscription.unsubscribe();
      }
    };
  }, [getSession]);

  const fetchCalendar = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_GC_CALENDAR
      );
      const data = await response.text();
  
      // Parse the .ics file
      const jcalData = ICAL.parse(data);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents("vevent").map(event => new ICAL.Event(event));
  
      const now = new Date();
  
      // Find the next valid event
      const upcomingEvent = events
        .filter(event => {
          let eventStartDate, eventEndDate;
  
          try {
            if (event.startDate) {
              if (event.startDate.isDate) {
                // All-day events
                eventStartDate = new Date(
                  event.startDate.year,
                  event.startDate.month - 1,
                  event.startDate.day
                );
                eventEndDate = event.endDate
                  ? new Date(
                      event.endDate.year,
                      event.endDate.month - 1,
                      event.endDate.day
                    )
                  : new Date(eventStartDate); // Use start date if end date is missing
              } else {
                // Timed events
                eventStartDate = event.startDate.toJSDate();
                eventEndDate = event.endDate ? event.endDate.toJSDate() : eventStartDate;
              }
            } else {
              return false; // Skip events without a valid start date
            }
  
            // Validate and normalize dates
            if (!(eventStartDate instanceof Date) || isNaN(eventStartDate)) {
              return false; // Skip invalid dates
            }
            if (!(eventEndDate instanceof Date) || isNaN(eventEndDate)) {
              eventEndDate = new Date(eventStartDate);
            }
  
            eventStartDate.setHours(0, 0, 0, 0);
            eventEndDate.setHours(0, 0, 0, 0);
  
            return eventEndDate >= now; // Include ongoing and future events
          } catch (error) {
            console.warn("Invalid event data:", event, error);
            return false; // Skip events with parsing errors
          }
        })
        .sort((a, b) => a.startDate.toJSDate() - b.startDate.toJSDate())[0]; // Sort and pick the earliest
  
      if (upcomingEvent) {
        setNextEvent({
          summary: upcomingEvent.summary || "No Title",
          startDate: upcomingEvent.startDate.isDate
            ? new Date(upcomingEvent.startDate.year, upcomingEvent.startDate.month - 1, upcomingEvent.startDate.day)
            : upcomingEvent.startDate.toJSDate(),
          endDate: upcomingEvent.endDate
            ? (upcomingEvent.endDate.isDate
                ? new Date(upcomingEvent.endDate.year, upcomingEvent.endDate.month - 1, upcomingEvent.endDate.day)
                : upcomingEvent.endDate.toJSDate())
            : null,
          location: upcomingEvent.location || "No Location",
        });
      }
    } catch (error) {
      console.error("Error fetching or parsing calendar:", error);
    }
  };

  useEffect(() => {
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
      <div className="header">
      {nextEvent ? (
        <div>
          <h2>Next Event:</h2>
          <p>{nextEvent.summary}</p>
          <p>{new Date(nextEvent.startDate).toLocaleString()}</p>
        </div>
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