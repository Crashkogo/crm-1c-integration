import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Users() {
  const [users, setUsers] = useState([]);
  const [users1C, setUsers1C] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newUser, setNewUser] = useState({ login: '', password: '', name: '', user1CId: '', role: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', password: '', user1CId: '', role: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // Функция для обновления токена
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await axios.post('http://localhost:3000/auth/refresh', { refreshToken });
      const newAccessToken = response.data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);
      console.log('Access token refreshed:', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
      return null;
    }
  };

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    let accessToken = localStorage.getItem('accessToken');
    console.log('Access Token:', accessToken);
    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      navigate('/');
      return;
    }

    const fetchWithRetry = async (url, options) => {
      try {
        const response = await axios(url, options);
        return response;
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Received 401, attempting to refresh token');
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            options.headers.Authorization = `Bearer ${newAccessToken}`;
            return await axios(url, options);
          }
        }
        throw error;
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetchWithRetry('http://localhost:3000/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        if (error.response?.status === 401) {
          console.log('Unauthorized: Redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/');
        }
      }
    };

    const fetchUsers1C = async () => {
      try {
        const response = await fetchWithRetry('http://localhost:3000/users/1c', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUsers1C(response.data);
      } catch (error) {
        console.error('Error fetching 1C users:', error);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await fetchWithRetry('http://localhost:3000/roles', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('Fetched roles:', response.data);
        setRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    };

    fetchUsers();
    fetchUsers1C();
    fetchRoles();
  }, [navigate]);

  // Создание нового пользователя
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      let accessToken = localStorage.getItem('accessToken');
      const userData = { ...newUser, roleId: newUser.role };
      if (userData.user1CId === '') delete userData.user1CId;
      if (userData.roleId === '') delete userData.roleId;
      console.log('Creating user with data:', userData);
      const response = await axios.post('http://localhost:3000/auth/register', userData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNewUser({ login: '', password: '', name: '', user1CId: '', role: '' });
      setShowCreateModal(false);
      const usersResponse = await axios.get('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  // Открытие формы редактирования
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      password: '',
      user1CId: user.user1C?.id || '',
      role: user.roles[0]?.id || '',
    });
  };

  // Обновление пользователя
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      let accessToken = localStorage.getItem('accessToken');
      const updateData = { ...editForm, roleId: editForm.role };
      if (updateData.user1CId === '') updateData.user1CId = '';
      if (updateData.roleId === '') delete updateData.roleId;
      console.log('Updating user with data:', updateData);
      await axios.put(`http://localhost:3000/users/${editingUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setEditingUser(null);
      setEditForm({ name: '', password: '', user1CId: '', role: '' });
      const response = await axios.get('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
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
              className="w-full text-left text-1c-blue font-semibold"
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
          <h1 className="text-xl font-semibold text-1c-gray-dark">Управление пользователями</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-1c-yellow text-1c-gray-dark px-4 py-2 rounded-lg hover:bg-1c-yellow-dark transition duration-200"
          >
            Создать пользователя
          </button>
        </header>
        <div className="bg-white rounded-xl shadow-1c p-6 border border-1c-gray-light">
          <h2 className="text-lg font-semibold text-1c-gray-dark mb-4">Список пользователей</h2>
          {users.length === 0 ? (
            <p className="text-1c-gray">Пользователи отсутствуют</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-1c-form-bg">
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Логин</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Имя</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Роль</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Пользователь 1С</th>
                    <th className="p-3 text-1c-gray-dark font-semibold border-b border-1c-gray-light">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-1c-form-bg">
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.login}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.name || 'Не указано'}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.roles[0]?.name || 'Нет роли'}</td>
                      <td className="p-3 border-b border-1c-gray-light text-1c-gray-dark">{user.user1C ? user.user1C.name : 'Не привязан'}</td>
                      <td className="p-3 border-b border-1c-gray-light">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="bg-1c-blue text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Модальное окно для создания пользователя */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-1c w-full max-w-md border border-1c-gray-light">
              <h2 className="text-lg font-semibold text-1c-gray-dark mb-4">Создать пользователя</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="new-login">
                    Логин
                  </label>
                  <input
                    type="text"
                    id="new-login"
                    placeholder="Введите логин"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="new-password">
                    Пароль
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    placeholder="Введите пароль"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="new-name">
                    Имя
                  </label>
                  <input
                    type="text"
                    id="new-name"
                    placeholder="Введите имя"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="new-role">
                    Роль
                  </label>
                  <select
                    id="new-role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                    required
                  >
                    <option value="">Выберите роль</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="new-user1c">
                    Привязать пользователя 1С (опционально)
                  </label>
                  <select
                    id="new-user1c"
                    value={newUser.user1CId}
                    onChange={(e) => setNewUser({ ...newUser, user1CId: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  >
                    <option value="">Не привязан</option>
                    {users1C.map((user1c) => (
                      <option key={user1c.id} value={user1c.id}>
                        {user1c.name} (ID: {user1c.externalId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-1c-green text-white p-3 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-1c-red text-white p-3 rounded-lg hover:bg-red-700 transition duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно для редактирования пользователя */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-1c w-full max-w-md border border-1c-gray-light">
              <h2 className="text-lg font-semibold text-1c-gray-dark mb-4">
                Редактировать пользователя: {editingUser.login}
              </h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="edit-name">
                    Имя
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    placeholder="Введите имя"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="edit-password">
                    Новый пароль (оставьте пустым, если не меняете)
                  </label>
                  <input
                    type="password"
                    id="edit-password"
                    placeholder="Введите новый пароль"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="edit-role">
                    Роль
                  </label>
                  <select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  >
                    <option value="">Выберите роль</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="edit-user1c">
                    Привязать пользователя 1С
                  </label>
                  <select
                    id="edit-user1c"
                    value={editForm.user1CId}
                    onChange={(e) => setEditForm({ ...editForm, user1CId: e.target.value })}
                    className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
                  >
                    <option value="">Не привязан</option>
                    {users1C.map((user1c) => (
                      <option key={user1c.id} value={user1c.id}>
                        {user1c.name} (ID: {user1c.externalId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-1c-green text-white p-3 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="bg-1c-red text-white p-3 rounded-lg hover:bg-red-700 transition duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;