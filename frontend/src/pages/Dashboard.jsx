import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut } from 'react-icons/fi';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post('http://localhost:3000/auth/refresh', {
        refreshToken,
      });
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data.accessToken;
    } catch (error) {
      console.error('Refresh token error:', error.message);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
      return null;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          token = await refreshAccessToken();
          if (token) {
            const response = await axios.get('http://localhost:3000/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/');
        }
      }
    };

    fetchUser();
  }, [navigate, refreshAccessToken]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  if (!user) return <div className="min-h-screen bg-1c-yellow-light flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-1c-yellow-light flex">
      <aside className="w-64 bg-white border-r border-1c-gray-light p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-1c-gray-dark">CRM 1C</h2>
        </div>
        <ul>
          <li className="mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left text-1c-blue font-semibold"
            >
              Рабочий стол
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => navigate('/users')}
              className="w-full text-left text-1c-gray hover:text-1c-blue transition duration-200"
            >
              Пользователи
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => navigate('/users1c')}
              className="w-full text-left text-1c-gray hover:text-1c-blue transition duration-200"
            >
              Пользователи 1С
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => navigate('/partners')}
              className="w-full text-left text-1c-gray hover:text-1c-blue transition duration-200"
            >
              Партнеры
            </button>
          </li>
        </ul>
      </aside>
      <div className="flex-1 p-6">
        <header className="bg-white border-b border-1c-gray-light p-4 mb-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-1c-gray-dark">Рабочий стол</h1>
          <button
            onClick={handleLogout}
            className="bg-1c-yellow text-1c-gray-dark px-4 py-2 rounded-lg hover:bg-1c-yellow-dark transition duration-200 flex items-center"
          >
            <FiLogOut className="mr-2" /> Выйти
          </button>
        </header>
        <div className="bg-white rounded-xl shadow-1c p-6 border border-1c-gray-light">
          <h2 className="text-2xl font-semibold text-1c-gray-dark mb-4">Добро пожаловать, {user.name}</h2>
          <div className="bg-1c-form-bg p-4 rounded-lg border border-1c-gray-light">
            <p className="text-1c-gray-dark">
              <span className="font-medium">Роль:</span> {user.roles[0].name}
            </p>
            <p className="text-1c-gray-dark mt-2">
              <span className="font-medium">ID пользователя:</span> {user.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;