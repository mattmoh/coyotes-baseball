// src/components/ImageSlider.jsx
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ImageSlider = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // List all files in the bucket
        const { data, error } = await supabase.storage
          .from('photos')
          .list('', { limit: 100 });

        if (error) {
          throw error;
        }

        console.log('Files in storage bucket:', data); 

        // Generate signed URLs for the images using name
        const imageUrls = await Promise.all(data.map(async (file) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('photos').createSignedUrl(file.name, 3600);
          if (signedUrlError) {
            console.error('Error generating signed URL:', signedUrlError);
          }
          console.log('Generated signed URL:', signedUrlData.signedUrl);
          return signedUrlData.signedUrl;
        }));

        setImages(imageUrls);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Slider {...sliderSettings}>
        {images.map((url, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <img 
              src={url} 
              alt={`Slide ${index}`} 
              style={{ width: '100%', borderRadius: '8px' }} 
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlider;
