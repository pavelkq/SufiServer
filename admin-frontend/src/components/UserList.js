import React, { useEffect, useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  FunctionField,
  DeleteButton,
  useNotify,
  useRefresh,
  useDataProvider,
  useUpdate,
  TopToolbar,
  Button,
} from 'react-admin';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextFieldMui from '@mui/material/TextField';
import ButtonMui from '@mui/material/Button';

// Новая кнопка "Сбросить пароль"
const ResetPasswordButton = ({ record }) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Подтвердите отправку письма для сброса пароля пользователю "${record.email}"?`)) return;
    setLoading(true);
    try {
      const response = await fetch('/api/auth-service/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: record.email }),
      });
      if (response.ok) {
        notify('Письмо для сброса пароля отправлено', { type: 'info' });
      } else {
        const data = await response.json().catch(() => ({}));
        notify(data.error || 'Ошибка при запросе сброса пароля', { type: 'warning' });
      }
    } catch (e) {
      notify('Сетевая ошибка при запросе сброса пароля', { type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ButtonMui
      variant="outlined"
      size="small"
      color="primary"
      disabled={loading}
      onClick={handleClick}
      style={{ marginLeft: 8 }}
    >
      {loading ? '...' : 'Сбросить пароль'}
    </ButtonMui>
  );
};

// ===== Отправка подтверждения email =====
const SendConfirmationButton = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();

  const handleClick = (event) => {
    event.stopPropagation();
    const token = localStorage.getItem('accessToken');
    fetch('/api/admin-backend/users/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: record.id }),
    })
      .then((res) => {
        if (res.ok) {
          notify('Письмо с подтверждением отправлено');
        } else {
          notify('Ошибка при отправке письма', { type: 'warning' });
        }
        refresh();
      })
      .catch(() => {
        notify('Ошибка при отправке письма', { type: 'warning' });
        refresh();
      });
  };

  return (
    <button onClick={handleClick}>Отправить подтверждение</button>
  );
};

const GroupSelectField = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(record.role || '');
  const [update] = useUpdate();

  useEffect(() => {
    dataProvider
      .getList('groups', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      })
      .then(({ data }) => setGroups(data))
      .catch(() => notify('Не удалось загрузить список групп', { type: 'warning' }));
  }, [dataProvider, notify]);

  const handleClick = (event) => {
    event.stopPropagation();
  };

  const handleChange = (event) => {
    const newGroupId = event.target.value || null;
    setGroupId(newGroupId);
    update(
      'users',
      { id: record.id, data: { role: newGroupId }, previousData: record },
      {
        onSuccess: () => {
          notify('Группа успешно обновлена');
          refresh();
        },
        onFailure: () => {
          notify('Ошибка при обновлении группы', { type: 'warning' });
        },
      }
    );
  };

  return (
    <select onClick={handleClick} onChange={handleChange} value={groupId} style={{ width: 150 }}>
      <option value="">Без группы</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  );
};

const EmailConfirmedField = ({ record }) => {
  if (record.email_confirmed) {
    return <span style={{ color: 'green', fontSize: 22 }}>✔</span>;
  }
  return <SendConfirmationButton record={record} />;
};

const UserListActions = ({ onCreateClick }) => (
  <TopToolbar>
    <Button label="Новый пользователь" onClick={onCreateClick} />
  </TopToolbar>
);

export const UserList = (props) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ email: '', password: '', name: '' });
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async () => {
    const { email, password, name } = formData;

    if (!email || !password) {
      notify('Email и пароль обязательны', { type: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/auth-service/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        notify(`Ошибка: ${errorData.error || res.statusText}`, { type: 'warning' });
      } else {
        notify('Пользователь успешно создан');
        handleClose();
        refresh();
      }
    } catch (error) {
      notify(`Ошибка сети: ${error.message}`, { type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <List {...props} actions={<UserListActions onCreateClick={handleOpen} />}>
        <Datagrid rowClick="edit">
          <TextField source="id" label="ID" />
          <TextField source="name" label="Имя" />
          <EmailField source="email" label="Email" />
          <FunctionField label="Группа" render={(record) => <GroupSelectField record={record} />} />
          <FunctionField label="Email подтверждён" render={(record) => <EmailConfirmedField record={record} />} />
          {/* Новая кнопка сброса пароля */}
          <FunctionField
            label="Сбросить пароль"
            render={(record) => <ResetPasswordButton record={record} />}
          />
          <DeleteButton />
        </Datagrid>
      </List>

      {/* Модальное окно создания пользователя */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Создать нового пользователя</DialogTitle>
        <DialogContent>
          <TextFieldMui
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange('email')}
          />
          <TextFieldMui
            margin="dense"
            label="Пароль"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange('password')}
          />
          <TextFieldMui
            margin="dense"
            label="Имя"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange('name')}
          />
        </DialogContent>
        <DialogActions>
          <ButtonMui onClick={handleClose} disabled={loading}>
            Отмена
          </ButtonMui>
          <ButtonMui onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
            {loading ? 'Создание...' : 'Создать'}
          </ButtonMui>
        </DialogActions>
      </Dialog>
    </>
  );
};
