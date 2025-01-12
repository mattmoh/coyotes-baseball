import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Carousel from 'react-bootstrap/Carousel';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Photos.css'; // Import the new CSS file

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Photos = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data: files, error } = await supabase.storage.from('photos').list('');
      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      if (!files || files.length === 0) {
        console.warn('No photos found in the bucket.');
        return;
      }

      const photoUrls = files.map(file => {
        const { data: publicURLData, error: publicURLError } = supabase.storage.from('photos').getPublicUrl(file.name);
        if (publicURLError) {
          console.error('Error getting public URL:', publicURLError);
          return null;
        }
        return publicURLData.publicUrl;
      });

      setPhotos(photoUrls.filter(url => url !== null));
    };

    fetchPhotos();
  }, []);

  return (
    <div className="photos-container">
      <Carousel>
        {photos.map((photo, index) => (
          <Carousel.Item key={index}>
            <img
              className="d-block w-100 photo-item"
              src={photo}
              alt={`Slide ${index}`}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default Photos;
