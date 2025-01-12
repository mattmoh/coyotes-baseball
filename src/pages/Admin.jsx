import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [userPlayerMap, setUserPlayerMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsersAndPlayers = async () => {
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      const { data: playersData, error: playersError } = await supabase.from('players').select('*');
      if (usersError || playersError) {
        setError('Error fetching users or players');
      } else {
        setUsers(usersData);
        setPlayers(playersData);
        const initialMap = usersData.reduce((acc, user) => {
          acc[user.id] = user.player_id || '';
          return acc;
        }, {});
        setUserPlayerMap(initialMap);
      }
    };
    fetchUsersAndPlayers();
  }, []);

  const handleUpdateUser = async () => {
    const updates = Object.keys(userPlayerMap).map(userId => {
      return supabase.from('users').update({ player_id: userPlayerMap[userId] }).eq('id', userId);
    });
    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      setError('Error updating some users');
    } else {
      setMessage('Users updated successfully');
    }
  };

  const handlePlayerChange = (userId, playerId) => {
    setUserPlayerMap(prevMap => ({
      ...prevMap,
      [userId]: playerId
    }));
  };

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <div className="user-list">
        {users.map((user) => (
          <div key={user.id} className="user-item">
            <span>{user.email}</span>
            <select
              value={userPlayerMap[user.id]}
              onChange={(e) => handlePlayerChange(user.id, e.target.value)}
            >
              <option value="">Select Player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button onClick={handleUpdateUser}>Update Users</button>
    </div>
  );
};

export default Admin;
