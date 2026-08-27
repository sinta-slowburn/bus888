import { WeatherAreaForecast, WeatherSummary } from '../types';

export const weatherApi = {
  async get2HourNowcast(): Promise<WeatherSummary> {
    try {
      const res = await fetch('/api/weather/nowcast');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const item = data.items?.[0];
      const forecasts: WeatherAreaForecast[] = (item?.forecasts || []).map((f: any) => ({
        area: f.area,
        forecast: f.forecast,
        icon: getWeatherIcon(f.forecast)
      }));

      // Check if any area has rain
      const rainingAreas = forecasts.filter((f) =>
        f.forecast.toLowerCase().includes('rain') ||
        f.forecast.toLowerCase().includes('shower') ||
        f.forecast.toLowerCase().includes('thunder')
      );

      const rainAdvisory = rainingAreas.length > 0
        ? `Passing rain reported in ${rainingAreas.slice(0, 3).map((a) => a.area).join(', ')}. Keep an umbrella handy or use covered MRT walkways!`
        : 'Clear to partly cloudy conditions across the island. Great weather for commuting!';

      return {
        updateTimestamp: item?.update_timestamp || new Date().toISOString(),
        forecasts: forecasts.length > 0 ? forecasts : getDefaultForecasts(),
        temperatureRange: '26°C - 32°C',
        rainAdvisory
      };
    } catch {
      return {
        updateTimestamp: new Date().toISOString(),
        forecasts: getDefaultForecasts(),
        temperatureRange: '27°C - 31°C',
        rainAdvisory: 'Partly cloudy in central areas. Light showers possible in East Coast.'
      };
    }
  }
};

function getWeatherIcon(forecast: string): string {
  const f = forecast.toLowerCase();
  if (f.includes('thunder')) return 'thunderstorm';
  if (f.includes('heavy rain') || f.includes('shower')) return 'rainy';
  if (f.includes('light rain') || f.includes('passing')) return 'weather_mix';
  if (f.includes('cloudy') || f.includes('overcast')) return 'cloud';
  if (f.includes('fair') || f.includes('sunny')) return 'wb_sunny';
  if (f.includes('wind')) return 'air';
  return 'partly_cloudy_day';
}

function getDefaultForecasts(): WeatherAreaForecast[] {
  return [
    { area: 'Marine Parade', forecast: 'Passing Showers', icon: 'weather_mix' },
    { area: 'Downtown / Marina Bay', forecast: 'Partly Cloudy', icon: 'partly_cloudy_day' },
    { area: 'Orchard', forecast: 'Partly Cloudy', icon: 'partly_cloudy_day' },
    { area: 'Bugis / City Hall', forecast: 'Fair (Day)', icon: 'wb_sunny' },
    { area: 'Tampines', forecast: 'Light Rain', icon: 'rainy' },
    { area: 'Jurong East', forecast: 'Cloudy', icon: 'cloud' },
    { area: 'Woodlands', forecast: 'Passing Showers', icon: 'weather_mix' },
    { area: 'Changi', forecast: 'Fair (Day)', icon: 'wb_sunny' },
    { area: 'Bishan', forecast: 'Partly Cloudy', icon: 'partly_cloudy_day' },
    { area: 'Bedok', forecast: 'Passing Showers', icon: 'weather_mix' },
    { area: 'HarbourFront / Sentosa', forecast: 'Fair (Day)', icon: 'wb_sunny' },
    { area: 'Clementi', forecast: 'Partly Cloudy', icon: 'partly_cloudy_day' }
  ];
}
