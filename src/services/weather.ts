const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export interface WeatherData {
  name: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
    visibility: number;
  };
  forecast: {
    dt: number;
    temp: number;
    description: string;
    icon: string;
    pop: number; // Probability of precipitation
  }[];
}

export async function getWeatherData(location: string | { lat: number; lon: number }): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error("OpenWeatherMap API key is required. Please set VITE_OPENWEATHER_API_KEY in your settings.");
  }

  try {
    let lat: number, lon: number, name: string;

    if (typeof location === 'string') {
      // 1. Geocoding
      let geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
      let geoData = await geoRes.json();
      
      // Fallback: If not found and seems like a local Indian place name (very common in this app context)
      if ((!geoData || geoData.length === 0) && !location.includes(',')) {
        geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location + ', India')}&limit=1&appid=${API_KEY}`);
        geoData = await geoRes.json();
      }

      // Hardcoded mapping for reported failures that are highly specific or common typos
      if (!geoData || geoData.length === 0) {
        const lowerLoc = location.toLowerCase();
        if (lowerLoc.includes('galgotias university')) {
          geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=Greater Noida, India&limit=1&appid=${API_KEY}`);
          geoData = await geoRes.json();
        } else if (lowerLoc.includes('baliagawan') || lowerLoc.includes('baligawan') || lowerLoc.includes('baligaon') || lowerLoc.includes('baligawn')) {
          // These variations often refer to Baligaon or similar regions
          geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=Baligaon, India&limit=1&appid=${API_KEY}`);
          geoData = await geoRes.json();
        }
      }
      
      if (!geoData || geoData.length === 0) {
        throw new Error(`Location "${location}" not found. Please try a more specific city or region.`);
      }
      
      lat = geoData[0].lat;
      lon = geoData[0].lon;
      name = geoData[0].name;
    } else {
      lat = location.lat;
      lon = location.lon;
      // Reverse geocoding for coordinates to get a name
      const reverseRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
      const reverseData = await reverseRes.json();
      name = reverseData?.[0]?.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }

    // 2. Current Weather
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const currentData = await currentRes.json();

    // 3. Forecast (5 day / 3 hour)
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const forecastData = await forecastRes.json();

    // Map forecast data to a simpler format (one entry per day for simplicity in UI, or just first few)
    // Here we take the first few entries as hourly and one per day for daily
    const mappedForecast = forecastData.list.map((item: any) => ({
      dt: item.dt,
      temp: item.main.temp,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      pop: item.pop
    }));

    return {
      name,
      current: {
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        wind_speed: currentData.wind.speed,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
        visibility: currentData.visibility
      },
      forecast: mappedForecast
    };
  } catch (error) {
    console.error("Weather Service Error:", error);
    throw error;
  }
}
