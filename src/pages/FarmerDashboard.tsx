import { useState } from 'react';
import {
  Sprout,
  LogOut,
  TrendingUp,
  Cloud,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import PriceVisualization from '../components/farmer/PriceVisualization';
import WeatherAdvice from '../components/farmer/WeatherAdvice';
import CommunityForum from '../components/farmer/CommunityForum';

type TabType = 'prices' | 'weather' | 'forum';

export default function FarmerDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('prices');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const menuItems = [
    { id: 'prices' as TabType, label: 'Price Trends', icon: TrendingUp },
    { id: 'weather' as TabType, label: 'Weather & Advice', icon: Cloud },
    { id: 'forum' as TabType, label: 'Community Forum', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <div>
                <span className="text-lg font-bold text-gray-900">AgriTrack</span>
                <p className="text-xs text-gray-500">Farmer Portal</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Welcome back,</p>
              <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
              {profile?.region && (
                <p className="text-xs text-gray-500 mt-1">{profile.region}</p>
              )}
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b lg:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Sprout className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-900">AgriTrack</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'prices' && <PriceVisualization />}
            {activeTab === 'weather' && <WeatherAdvice />}
            {activeTab === 'forum' && <CommunityForum />}
          </div>
        </main>
      </div>
    </div>
  );
}
