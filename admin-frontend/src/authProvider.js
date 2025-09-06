const API_URL = '/api/auth-service';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Ошибка декодирования JWT:', error);
    return null;
  }
};

const authProvider = {
  login: ({ username, password }) => {
    return fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.message || 'Ошибка авторизации');
          });
        }
        return response.json();
      })
      .then(({ token }) => {
        const decodedToken = decodeJwt(token);

        if (decodedToken && decodedToken.role === 5) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('userRole', decodedToken.role);
          localStorage.setItem('userId', decodedToken.id);
          localStorage.setItem('userName', decodedToken.email);

          // Эта строка задаёт перенаправление после логина на /articles
          return Promise.resolve({ redirectTo: '/articles' });
        } else {
          return Promise.reject({ message: 'Вход разрешён только администраторам.' });
        }
      })
      .catch((error) => {
        console.error('Login failed:', error);
        throw new Error(error.message || 'Неизвестная ошибка при авторизации.');
      });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    return Promise.resolve();
  },

  checkAuth: ({ pathname } = {}) => {
    if (pathname && pathname.startsWith('/reset-password')) {
      return Promise.resolve();
    }

    const token = localStorage.getItem('accessToken');
    const userRole = parseInt(localStorage.getItem('userRole'), 10);

    if (token && userRole === 5) {
      return Promise.resolve();
    }
    return Promise.reject({ message: 'Требуется авторизация администратора.' });
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    if (userId && userName && userRole) {
      return Promise.resolve({
        id: userId,
        fullName: userName,
        role: parseInt(userRole, 10),
      });
    }
    return Promise.reject();
  },

  getPermissions: () => {
    const userRole = parseInt(localStorage.getItem('userRole'), 10);
    return userRole === 5 ? Promise.resolve('admin') : Promise.resolve('guest');
  },
};

export default authProvider;
