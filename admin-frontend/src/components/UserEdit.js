import React from 'react';
import { Edit, SimpleForm, TextInput, EmailField } from 'react-admin';

export const UserEdit = (props) => (
  <Edit {...props}>
    <SimpleForm>
      {/* Вместо DisabledInput используем TextInput с disabled */}
      <TextInput source="id" label="ID" disabled />
      <TextInput source="name" label="Имя" />
      <EmailField source="email" label="Email" />
    </SimpleForm>
  </Edit>
);
