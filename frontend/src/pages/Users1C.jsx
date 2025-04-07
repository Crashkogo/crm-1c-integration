import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Users1C() {
  const [users1c, setUsers1C] = useState([]);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/');
      return;
    }

    const fetchUsers1C = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/1c`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUsers1C(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/');
        }
      }
    };

    fetchUsers1C();
  }, [navigate, API_URL]); // Добавили API_URL в зависимости

  const handleSync = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/users/1c/sync`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      alert(response.data.message);
      // Обновляем список пользователей 1С после синхронизации
      const updatedUsers = await axios.get(`${API_URL}/users/1c`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers1C(updatedUsers.data);
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Ошибка синхронизации: ${error.response?.data?.error || error.message}`);
    }
  };

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
              className="w-full text-left text-1c-gray hover:text-1c-blue transition duration-200"
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
              className="w-full text-left text-1c-blue font-semibold"
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
          <h1 className="text-xl font-semibold text-1c-gray-dark">Пользователи 1С</h1>
          <button
            onClick={handleSync}
            className="bg-1c-yellow text-1c-gray-dark px-4 py-2 rounded-lg hover:bg-1c-yellow-dark transition duration-200"
          >
            Синхронизация данных
          </button>
        </header>
        <div className="bg-white rounded-xl shadow-1c p-6 border border-1c-gray-light">
          <h2 className="text-lg font-semibold text-1c-gray-dark mb-4">Список пользователей 1С</h2>
          {users1c.length === 0 ? (
            <p className="text-1c-gray">Пользователи отсутствуют</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-1c-form-bg">
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">ID</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Внешний ID</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Имя</th>
                  </tr>
                </thead>
                <tbody>
                  {users1c.map((user) => (
                    <tr key={user.id} className="hover:bg-1c-form-bg">
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.id}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.externalId}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users1C;