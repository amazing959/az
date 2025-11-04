import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Sun, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Item } from '../../lib/supabase';

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
}

interface PriceTrend {
  item: string;
  trend: 'rising' | 'falling' | 'stable';
  change: number;
}

export default function WeatherAdvice() {
  const { profile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [smartAdvice, setSmartAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      await Promise.all([generateMockWeather(), analyzePriceTrends()]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const generateMockWeather = async () => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Clear'];
    const mockWeather: WeatherData = {
      temperature: Math.floor(Math.random() * 15) + 20,
      humidity: Math.floor(Math.random() * 40) + 40,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      windSpeed: Math.floor(Math.random() * 20) + 5,
      precipitation: Math.floor(Math.random() * 30),
    };

    setWeather(mockWeather);
  };

  const analyzePriceTrends = async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, name')
        .limit(10);

      if (itemsError) throw itemsError;

      const trends: PriceTrend[] = [];

      for (const item of items || []) {
        const { data: prices, error: pricesError } = await supabase
          .from('prices')
          .select('price, date')
          .eq('item_id', item.id)
          .order('date', { ascending: false })
          .limit(7);

        if (pricesError || !prices || prices.length < 2) continue;

        const latestPrice = prices[0].price;
        const oldestPrice = prices[prices.length - 1].price;
        const change = ((latestPrice - oldestPrice) / oldestPrice) * 100;

        let trend: 'rising' | 'falling' | 'stable' = 'stable';
        if (change > 5) trend = 'rising';
        else if (change < -5) trend = 'falling';

        trends.push({
          item: item.name,
          trend,
          change,
        });
      }

      setPriceTrends(trends);
      generateSmartAdvice(trends);
    } catch (error) {
      console.error('Error analyzing price trends:', error);
    }
  };

  const generateSmartAdvice = (trends: PriceTrend[]) => {
    const advice: string[] = [];

    const risingItems = trends.filter((t) => t.trend === 'rising');
    const fallingItems = trends.filter((t) => t.trend === 'falling');

    if (risingItems.length > 0) {
      const topRising = risingItems.sort((a, b) => b.change - a.change)[0];
      advice.push(
        `${topRising.item} prices are rising (+${topRising.change.toFixed(1)}%). Consider selling your stock now for better profits.`
      );
    }

    if (fallingItems.length > 0) {
      const topFalling = fallingItems.sort((a, b) => a.change - b.change)[0];
      advice.push(
        `${topFalling.item} prices are falling (${topFalling.change.toFixed(1)}%). Hold your stock if possible or consider planting less next season.`
      );
    }

    if (weather) {
      if (weather.condition === 'Rainy' || weather.precipitation > 50) {
        advice.push(
          'Heavy rain expected. Avoid watering crops and protect sensitive plants. Ensure proper drainage in fields.'
        );
      }

      if (weather.temperature > 35) {
        advice.push(
          'High temperatures forecasted. Increase irrigation frequency and consider shade netting for sensitive crops.'
        );
      }

      if (weather.temperature < 10) {
        advice.push(
          'Cold weather alert. Protect sensitive crops from frost. Consider covering plants overnight.'
        );
      }

      if (weather.windSpeed > 25) {
        advice.push(
          'Strong winds expected. Secure loose equipment and provide support for tall crops.'
        );
      }

      if (weather.humidity < 40) {
        advice.push(
          'Low humidity levels. Monitor soil moisture closely and increase watering frequency if needed.'
        );
      }

      if (weather.condition === 'Sunny' && weather.temperature < 30) {
        advice.push(
          'Ideal weather conditions for harvesting. Plan to harvest mature crops for better quality and market value.'
        );
      }
    }

    if (advice.length === 0) {
      advice.push('Weather and market conditions are stable. Continue regular farming activities.');
    }

    setSmartAdvice(advice);
  };

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-12 h-12 text-gray-400" />;

    switch (weather.condition) {
      case 'Sunny':
      case 'Clear':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case 'Rainy':
        return <Droplets className="w-12 h-12 text-blue-500" />;
      default:
        return <Cloud className="w-12 h-12 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading weather and advice...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Weather & Smart Advice</h2>
        <p className="text-gray-600 mt-1">
          Regional weather updates and data-driven farming recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Current Weather</h3>
              <p className="text-sm text-gray-600">
                {profile?.region || 'Your Region'}
              </p>
            </div>
            {getWeatherIcon()}
          </div>

          {weather && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Temperature</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {weather.temperature}°C
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Humidity</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {weather.humidity}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wind className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Wind Speed</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {weather.windSpeed} km/h
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Precipitation</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {weather.precipitation}%
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">Condition</p>
                  <p className="text-lg font-bold text-blue-600">{weather.condition}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Market Trends (7 Days)</h3>

          {priceTrends.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No price data available</p>
          ) : (
            <div className="space-y-3">
              {priceTrends.slice(0, 6).map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {trend.trend === 'rising' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : trend.trend === 'falling' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-5 h-1 bg-gray-400 rounded" />
                    )}
                    <span className="font-medium text-gray-900">{trend.item}</span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      trend.trend === 'rising'
                        ? 'text-green-600'
                        : trend.trend === 'falling'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {trend.change > 0 ? '+' : ''}
                    {trend.change.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-100 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Smart Farming Advice</h3>
        </div>

        <div className="space-y-3">
          {smartAdvice.map((advice, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm"
            >
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-600">{index + 1}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{advice}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> These recommendations are based on current weather data and
            market trends. Always consult with local agricultural experts for critical
            decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
