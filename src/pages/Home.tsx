import { Sprout, TrendingUp, Users, Cloud } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">AgriTrack Pakistan</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('login')}
                className="px-4 py-2 text-green-700 hover:text-green-900 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('register')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Agriculture Market Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering Pakistani farmers with real-time market prices, weather updates,
            and intelligent farming advice to maximize profits and reduce risks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Price Trends</h3>
            <p className="text-gray-600">
              Track daily market rates and 7-day price trends for vegetables and fruits
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather Updates</h3>
            <p className="text-gray-600">
              Get region-specific weather forecasts to plan your farming activities
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Sprout className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Advice</h3>
            <p className="text-gray-600">
              Receive data-driven recommendations based on market trends and weather
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forum</h3>
            <p className="text-gray-600">
              Connect with fellow farmers to share knowledge and experiences
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of Pakistani farmers who are already using AgriTrack to make
            informed decisions and increase their income.
          </p>
          <button
            onClick={() => navigate('register')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
          >
            Register as Farmer
          </button>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            © 2025 AgriTrack Pakistan. Empowering farmers with technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
