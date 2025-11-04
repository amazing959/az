import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePage, useNavigate } from './hooks/useNavigate';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';

function AppContent() {
  const page = usePage();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin' && page !== 'admin') {
        navigate('admin');
      } else if (profile.role === 'farmer' && page !== 'farmer') {
        navigate('farmer');
      }
    } else if (!loading && !user && (page === 'admin' || page === 'farmer')) {
      navigate('home');
    }
  }, [loading, user, profile, page, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (page) {
    case 'login':
      return <Login />;
    case 'register':
      return <Register />;
    case 'admin':
      return user && profile?.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <Login />
      );
    case 'farmer':
      return user && profile?.role === 'farmer' ? (
        <FarmerDashboard />
      ) : (
        <Login />
      );
    default:
      return <Home />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
