import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      axios
        .get('http://localhost:3000/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then(() => navigate('/dashboard'))
        .catch(async () => {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post('http://localhost:3000/auth/refresh', {
                refreshToken,
              });
              localStorage.setItem('accessToken', response.data.accessToken);
              navigate('/dashboard');
            } catch {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        login,
        password,
      });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-1c-yellow-light p-4">
      <div className="bg-white p-8 rounded-xl shadow-1c w-full max-w-md border border-1c-gray-light">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-1c-gray-dark">CRM 1C</h1>
          <p className="text-1c-gray text-sm mt-2">Вход в систему</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="login">
              Логин
            </label>
            <input
  type="text"
  id="login"
  placeholder="Введите логин"
  value={login}
  onChange={(e) => setLogin(e.target.value)}
  className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200 shadow-sm"
/>
          </div>
          <div className="mb-6">
            <label className="block text-1c-gray-dark text-sm font-medium mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-1c-form-bg border border-1c-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-1c-yellow transition duration-200"
            />
          </div>
          {error && (
            <p className="text-1c-red text-sm mb-4 bg-1c-red-light p-2 rounded">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-1c-yellow text-1c-gray-dark p-3 rounded-lg hover:bg-1c-yellow-dark transition duration-200 transform hover:scale-105"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;