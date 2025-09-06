// src/components/CategoryList.js
import React from 'react';
import { List, Datagrid, TextField, EditButton } from 'react-admin';

export const CategoryList = (props) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <EditButton />
    </Datagrid>
  </List>
);
