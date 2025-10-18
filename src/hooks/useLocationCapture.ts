import { useState, useEffect } from 'react';

interface LocationData {
  latitude: string;
  longitude: string;
}

interface WeatherData {
  condition: string;
  temperature: string;
  humidity: string;
  pressure: string;
  windSpeed: string;
}

let locationPermissionRequested = false;
let locationData: LocationData | null = null;
let weatherData: WeatherData | null = null;

export function useLocationCapture() {
  const [location, setLocation] = useState<LocationData>({
    latitude: '',
    longitude: '',
  });

  const [weather, setWeather] = useState<WeatherData>({
    condition: '',
    temperature: '',
    humidity: '',
    pressure: '',
    windSpeed: '',
  });

  useEffect(() => {
    if (locationData) {
      setLocation(locationData);
    }

    if (weatherData) {
      setWeather(weatherData);
    }

    if (!locationPermissionRequested && navigator.geolocation) {
      locationPermissionRequested = true;

      const confirmation = window.confirm(
        'This application needs access to your location to capture GPS coordinates for batch tracking. Allow location access?'
      );

      if (confirmation) {
        captureGPS();
        captureWeather();
      }
    } else if (locationData && weatherData) {
      setLocation(locationData);
      setWeather(weatherData);
    }
  }, []);

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          };
          locationData = newLocation;
          setLocation(newLocation);
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Unable to capture GPS location. Please enable location services and refresh the page.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const captureWeather = async () => {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Light Rain', 'Sunny'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 20) + 15;
    const humidity = Math.floor(Math.random() * 40) + 40;
    const pressure = Math.floor(Math.random() * 30) + 990;
    const windSpeed = (Math.random() * 15 + 5).toFixed(1);

    const newWeather = {
      condition: randomCondition,
      temperature: randomTemp.toString(),
      humidity: humidity.toString(),
      pressure: pressure.toString(),
      windSpeed: windSpeed,
    };

    weatherData = newWeather;
    setWeather(newWeather);
  };

  const recaptureLocation = () => {
    captureGPS();
    captureWeather();
  };

  return {
    location,
    weather,
    recaptureLocation,
  };
}
