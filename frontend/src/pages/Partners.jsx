// src/pages/Partners.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Partners() {
  const [partners, setPartners] = useState([]);
  const navigate = useNavigate();

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      const response = await axios.post('http://localhost:3000/auth/refresh', { refreshToken });
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

  const fetchWithRetry = useCallback(async (url, options) => {
    try {
      const response = await axios(url, options);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          options.headers.Authorization = `Bearer ${newAccessToken}`;
          return await axios(url, options);
        }
      }
      throw error;
    }
  }, [refreshAccessToken]);

  const fetchPartners = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/');
      return;
    }

    try {
      const response = await fetchWithRetry('http://localhost:3000/partners', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  }, [navigate, fetchWithRetry]);

  const handleSync = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetchWithRetry('http://localhost:3000/partners/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert(response.data.message);
      fetchPartners(); // Обновляем список после синхронизации
    } catch (error) {
      console.error('Error syncing partners:', error);
      alert('Ошибка синхронизации: ' + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]); // Теперь fetchPartners в зависимостях

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
              className="w-full text-left text-1c-gray hover:text-1c-blue transition duration-200"
            >
              Пользователи 1С
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => navigate('/partners')}
              className="w-full text-left text-1c-blue font-semibold"
            >
              Партнеры
            </button>
          </li>
        </ul>
      </aside>
      <div className="flex-1 p-6">
        <header className="bg-white border-b border-1c-gray-light p-4 mb-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-1c-gray-dark">Партнеры</h1>
          <button
            onClick={handleSync}
            className="bg-1c-yellow text-1c-gray-dark px-4 py-2 rounded-lg hover:bg-1c-yellow-dark transition duration-200"
          >
            Синхронизировать с 1С
          </button>
        </header>
        <div className="bg-white rounded-xl shadow-1c p-6 border border-1c-gray-light">
          <h2 className="text-lg font-semibold text-1c-gray-dark mb-4">Список партнеров</h2>
          {partners.length === 0 ? (
            <p className="text-1c-gray">Партнеры отсутствуют. Попробуйте синхронизировать данные с 1С.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-1c-form-bg">
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Название</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">ИНН</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Основной менеджер</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Контактные лица</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-1c-form-bg">
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{partner.name}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{partner.inn || 'Не указано'}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{partner.mainManager || 'Не указано'}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">
                        {partner.contactPersons.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {partner.contactPersons.map((contact) => (
                              <li key={contact.id}>
                                {contact.name} ({contact.position || 'Должность не указана'}) -{' '}
                                {contact.mobilePhone || contact.phone || 'Нет телефона'}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          'Нет контактов'
                        )}
                      </td>
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

export default Partners;