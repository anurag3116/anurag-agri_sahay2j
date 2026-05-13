import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, 
  CloudLightning, Snowflake, Wind, Droplets, MapPin, 
  Search, Calendar, Thermometer, Eye, Sprout, AlertCircle,
  Loader2, RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { getWeatherData, WeatherData } from '@/services/weather';
import { getTranslation } from '@/constants/translations';

const iconMap: Record<string, any> = {
  '01d': Sun,
  '01n': Moon,
  '02d': CloudSun,
  '02n': CloudMoon,
  '03d': Cloud,
  '03n': Cloud,
  '04d': Cloud,
  '04n': Cloud,
  '09d': CloudRain,
  '09n': CloudRain,
  '10d': CloudRain,
  '10n': CloudRain,
  '11d': CloudLightning,
  '11n': CloudLightning,
  '13d': Snowflake,
  '13n': Snowflake,
  '50d': Wind,
  '50n': Wind,
};

export default function Weather() {
  const { settings } = useApp();
  const t = getTranslation(settings.language);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWeather = useCallback(async (location: string | { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherData(location);
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather({ lat: latitude, lon: longitude });
        setDetecting(false);
      },
      (err) => {
        setError('Location access denied. Please enable location permissions.');
        setDetecting(false);
      }
    );
  };

  useEffect(() => {
    fetchWeather(settings.location);
  }, [settings.location, fetchWeather]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchWeather(searchTerm);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString([], { weekday: 'short' });
  };

  if (loading && !weather) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Synchronizing with weather satellites...</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Satellite Link Offline</h2>
        <p className="text-slate-500 max-w-sm mb-6">{error}</p>
        <button 
          onClick={() => fetchWeather(settings.location)}
          className="px-6 py-2 bg-emerald-900 text-white rounded-lg font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // Filter forecast to show roughly one per day for the 5-day view
  const dailyForecast = weather ? weather.forecast.filter((_, i) => i % 8 === 0).slice(0, 5) : [];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.weatherIntel}</h1>
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em] mt-1">
            Satellite Link: {weather?.name || settings.location} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDetectLocation}
            disabled={detecting}
            className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-emerald-700 hover:border-emerald-200 transition-all group disabled:opacity-50"
            title="Use My Location"
          >
            {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          </button>
          <form onSubmit={handleSearch} className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sector..."
              className="bg-transparent px-3 py-1 text-[10px] uppercase font-bold outline-hidden w-40 md:w-48"
            />
            <button type="submit" className="p-2 bg-emerald-900 text-white rounded-md hover:bg-emerald-800 transition-colors">
              <Search className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {!weather ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Weather Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-emerald-900 text-white p-8 overflow-hidden relative border-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 text-emerald-50">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {weather.name}
                  </div>
                  <div>
                    <h2 className="text-7xl font-bold tracking-tighter">{Math.round(weather.current.temp)}°C</h2>
                    <p className="text-xl font-medium mt-1 uppercase text-emerald-300 tracking-tight">{weather.current.description}</p>
                  </div>
                  <p className="text-emerald-400 text-xs font-medium italic">
                    {weather.current.humidity > 70 ? "High humidity risk detected. Check for fungal signs." : "Current humidity levels are within optimal range."}
                  </p>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <div className="w-32 h-32 bg-emerald-400/10 rounded-full flex items-center justify-center border border-emerald-400/20">
                    {(() => {
                      const Icon = iconMap[weather.current.icon] || Sun;
                      return <Icon className="w-20 h-20 text-emerald-400" />;
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {t.feelsLike} {Math.round(weather.current.feels_like)}°C
                    </p>
                    <p className="text-[10px] text-emerald-500 mt-1">Refreshed: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <WeatherDetailCard icon={Wind} label={t.windSpeed} value={`${weather.current.wind_speed} m/s`} desc="Average Velocity" />
              <WeatherDetailCard icon={Droplets} label={t.humidityIndex} value={`${weather.current.humidity}%`} desc="Direct Readout" />
              <WeatherDetailCard icon={Eye} label={t.visibility} value={`${weather.current.visibility / 1000} km`} desc="Visual Range" />
              <WeatherDetailCard icon={Calendar} label={t.precipitation} value={`${Math.round(weather.forecast[0]?.pop * 100)}%`} desc="Immediate Probability" />
            </div>

            <div className="card">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">{t.fiveDayForecast}</h3>
              <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar -mx-2 px-2 md:-mx-0 md:px-0 md:grid md:grid-cols-5 md:pb-0">
                {dailyForecast.map((item, i) => {
                  const Icon = iconMap[item.icon] || Sun;
                  return (
                    <div key={i} className="min-w-[100px] flex flex-col items-center p-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-default text-center">
                      <span className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">{getDayName(item.dt)}</span>
                      <Icon className={cn("w-6 h-6 mb-3", item.description.includes('rain') ? "text-blue-500" : "text-emerald-600")} />
                      <span className="font-bold text-sm tracking-tight">{Math.round(item.temp)}°</span>
                      <span className="text-[9px] font-medium text-slate-500 mt-1 text-center leading-tight uppercase tracking-tighter">{item.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Agricultural Impact Card */}
          <div className="space-y-6">
            <div className="card p-0 overflow-hidden border border-slate-200 shadow-sm bg-white">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-bold font-sans flex items-center gap-2 uppercase tracking-widest text-emerald-900">
                  <Sprout className="w-3 h-3" />
                  {t.agronomistView}
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="relative bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Soil Moisture Loss</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      weather.current.temp > 30 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {weather.current.temp > 30 ? "Accelerated" : "Controlled"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((weather.current.temp / 40) * 100, 100)}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        weather.current.temp > 30 ? "bg-amber-500" : "bg-emerald-500"
                      )} 
                    />
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {Math.round((weather.current.temp / 5) * 10) / 10} mm 
                    <span className="text-[10px] font-medium text-slate-400 italic ml-1">Est. ETc loss/day</span>
                  </p>
                </div>

                <div className="relative bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Root Health Risk</span>
                    <span className="text-emerald-700 text-[10px] font-bold uppercase">Optimal Range</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-emerald-700 rounded-full" 
                    />
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {Math.round(weather.current.temp - 3)}°C 
                    <span className="text-[10px] font-medium text-slate-400 italic ml-1">at root level</span>
                  </p>
                </div>
              </div>
            </div>

            {weather.current.temp > 30 || weather.forecast[0]?.pop > 0.5 ? (
              <div className="card bg-amber-50 border-amber-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  {t.farmingAlert}
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {weather.current.temp > 30 
                    ? "Extreme temperature alert. High risk of leaf scorch. Advised restricted transpiration periods."
                    : "Incoming precipitation detected. Defer active irrigation cycles for 12 hours."}
                </p>
              </div>
            ) : (
              <div className="card bg-emerald-50 border-emerald-100 shadow-sm">
                <h3 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Sprout className="w-4 h-4" />
                  {t.growthConditions}
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  Ideal metabolic conditions active. Recommended period for structural reinforcement/fertilization.
                </p>
              </div>
            )}

            <div className="card bg-white border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{t.celestialAlignment}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">{t.sunrise}</span>
                  <span className="text-slate-700">{formatTime(weather.current.sunrise)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">{t.sunset}</span>
                  <span className="text-slate-700">{formatTime(weather.current.sunset)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">{t.visibility}</span>
                  <span className="text-slate-700">{weather.current.visibility / 1000} KM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherDetailCard({ icon: Icon, label, value, desc }: any) {
  return (
    <div className="card p-4 bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center group border-dashed hover:border-emerald-200 transition-colors">
      <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-base font-bold tracking-tight">{value}</p>
      <p className="text-[9px] text-slate-400 mt-0.5 uppercase">{desc}</p>
    </div>
  );
}
