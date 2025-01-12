import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../App.css';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function Stats() {
  const [data, setData] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', season: '', batting: {}, combine: {}, pitching: {} });
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('batting');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (selectedSeason || selectedCategory || userRole) {
      fetchData();
    }
  }, [selectedSeason, selectedCategory, userRole]);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('players').select('*');
    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      setToastMessage('Error fetching user data');
      return;
    }

    setUserRole(userData.role);

    if (userData.role === 'parent' && userData.player_id) {
      query = query.eq('id', userData.player_id);
    }

    if (selectedSeason && selectedSeason !== '*') {
      query = query.eq('season', selectedSeason);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching data:', error);
      setToastMessage('Error fetching data');
    } else {
      setData(data);
    }
  };

  const fetchSeasons = async () => {
    const { data, error } = await supabase.from('seasons').select('*');
    if (error) {
      console.error('Error fetching seasons:', error);
      setToastMessage('Error fetching seasons');
    } else setSeasons(data);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.season) {
      setToastMessage('Please enter a name and select a season');
      return;
    }
    const { data, error } = await supabase.from('players').insert([{
      name: formData.name,
      season: formData.season,
      batting: {
        hits: 0,
        walks: 0,
        plate_appearances: 0,
        doubles: 0,
        singles: 0,
        triples: 0,
        home_runs: 0,
        sacrifices: 0,
        hit_by_pitch: 0
      },
      combine: {
        "40_ft_sprint": 0,
        "vertical_jump": 0,
        "20_ft_shuffle": 0,
        "med_ball_throw": 0
      },
      pitching: {
        innings_pitched: 0,
        balls: 0,
        strikes: 0,
        walks: 0,
        strikeouts: 0,
        hits: 0,
        earned_runs: 0
      }
    }]);
    if (error) {
      console.error('Error creating data:', error);
      setToastMessage('Error creating data');
    } else {
      fetchData();
      setFormData({ name: '', season: '', batting: {}, combine: {}, pitching: {} });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlayer) return;
    const { data, error } = await supabase.from('players').update(formData).eq('id', selectedPlayer.id);
    if (error) {
      console.error('Error updating data:', error);
      setToastMessage('Error updating data');
    } else {
      fetchData();
      setSelectedPlayer(null);
      setFormData({ name: '', season: '', batting: {}, combine: {}, pitching: {} });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderStatistics = (player, category) => {
    return Object.entries(player[category]).map(([key, value]) => (
      <td key={key}>
        <input
          type="text"
          name={`${category}.${key}`}
          value={formData.id === player.id ? formData[category][key] : value}
          onChange={(e) => handleChange(e, player.id)}
        />
      </td>
    ));
  };

  const handleChange = (e, playerId) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [category, key] = name.split('.');
      setFormData((prevData) => ({
        ...prevData,
        id: playerId,
        [category]: {
          ...prevData[category],
          [key]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setFormData((prevData) => ({
      ...prevData,
      season: e.target.value
    }));
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setFormData({
      ...player,
      season: player.season || ''
    });
  };

  const toTitleCase = (str) => {
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  return (
    <>
      <div className="category-selector">
        <label>
          <input
            type="radio"
            name="category"
            value="combine"
            checked={selectedCategory === 'combine'}
            onChange={handleCategoryChange}
          />
          Combine
        </label>
        <label>
          <input
            type="radio"
            name="category"
            value="pitching"
            checked={selectedCategory === 'pitching'}
            onChange={handleCategoryChange}
          />
          Pitching
        </label>
        <label>
          <input
            type="radio"
            name="category"
            value="batting"
            checked={selectedCategory === 'batting'}
            onChange={handleCategoryChange}
          />
          Batting
        </label>
      </div>
      <div className="season-selector">
        <label htmlFor="season">Select Season: </label>
        <select id="season" value={selectedSeason} onChange={handleSeasonChange}>
          <option value="*">All Seasons</option>
          {seasons.map((season) => (
            <option key={season.year} value={season.year}>{season.year}</option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Season</th>
            <th>Last Updated</th>
            {data.length > 0 && data[0][selectedCategory] && Object.keys(data[0][selectedCategory]).map(key => (
              <th key={key}>{toTitleCase(key)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((player) => (
            <tr key={player.id} onClick={() => handlePlayerSelect(player)}>
              <td>{player.name}</td>
              <td>{player.season}</td>
              <td>{formatDate(player.updated_at)}</td>
              {renderStatistics(player, selectedCategory)}
            </tr>
          ))}
        </tbody>
      </table>
      {toastMessage && <div className="toast">{toastMessage}</div>}
      {userRole === 'coach' && (
        <div className="form-container">
          <button onClick={handleUpdate}>Update</button>
        </div>
      )}
      {userRole === 'coach' && (
        <div className="form-container">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => handleChange(e, formData.id)}
          />
          <select
            name="season"
            value={formData.season}
            onChange={(e) => handleChange(e, formData.id)}
          >
            <option value="">Select Season</option>
            {seasons.map((season) => (
              <option key={season.year} value={season.year}>{season.year}</option>
            ))}
          </select>
          <button onClick={handleCreate}>Add Player</button>
        </div>
      )}
    </>
  );
}

export default Stats;
