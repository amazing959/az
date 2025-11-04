import { useState } from 'react';
import { Sprout, LogOut, Package, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import ItemManagement from '../components/admin/ItemManagement';
import PriceManagement from '../components/admin/PriceManagement';

type TabType = 'items' | 'prices';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('items');

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <div>
                <span className="text-xl font-bold text-gray-900">AgriTrack Admin</span>
                <p className="text-sm text-gray-500">{profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'items'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Item Management</span>
              </button>
              <button
                onClick={() => setActiveTab('prices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'prices'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Price Management</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'items' && <ItemManagement />}
            {activeTab === 'prices' && <PriceManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}
