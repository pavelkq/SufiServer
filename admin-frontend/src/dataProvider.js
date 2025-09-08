import { fetchUtils } from 'react-admin';

const API_BASES = {
  articles: '/api/admin-backend/articles',
  categories: '/api/admin-backend/articles/categories',
  tags: '/api/admin-backend/articles/tags',
  users: '/api/admin-backend/users',
  groups: '/api/admin-backend/groups',
  article_tags: '/api/admin-backend/articles/article_tags',
  article_versions: '/api/admin-backend/articles/article_versions',
};

const getApiBasePath = (resource) => {
  return API_BASES[resource] || `/api/admin-backend/${resource}`;
};

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const token = localStorage.getItem('accessToken');
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

const dataProvider = {
  getList: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    if (resource === 'categories' || resource === 'tags') {
      return httpClient(apiBasePath).then(({ json }) => ({
        data: json,
        total: json.length,
      }));
    }

    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};
    const filter = params.filter || {};
    const query = {
      page,
      perPage,
      sortField: field,
      sortOrder: order,
      filter: JSON.stringify(filter),
    };

    return httpClient(`${apiBasePath}?${fetchUtils.queryParameters(query)}`).then(({ json }) => {
      return {
        data: json.data || json,
        total: json.total || (json.data ? json.data.length : json.length),
      };
    });
  },

  getOne: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    if (typeof params.id === 'string' && isNaN(parseInt(params.id))) {
      console.warn('Invalid ID received:', params.id, 'for resource:', resource);
      return Promise.resolve({ data: { id: params.id, name: 'Error: Invalid ID' } });
    }
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return Promise.reject(new Error(`Invalid ID: ${params.id}`));
    }
    return httpClient(`${apiBasePath}/${id}`).then(({ json }) => ({
      data: json,
    }));
  },

  create: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    return httpClient(apiBasePath, {
      method: 'POST',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: { ...params.data, id: json.id || json }, // Подстройка под backend
    }));
  },

  update: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    if (typeof params.id === 'string' && isNaN(parseInt(params.id))) {
      console.warn('Invalid ID received for update:', params.id);
      return Promise.resolve({ data: params.data });
    }
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return Promise.reject(new Error(`Invalid ID: ${params.id}`));
    }
    return httpClient(`${apiBasePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json }));
  },

  delete: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    if (typeof params.id === 'string' && isNaN(parseInt(params.id))) {
      console.warn('Invalid ID received for delete:', params.id);
      return Promise.resolve({ data: { id: params.id } });
    }
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return Promise.reject(new Error(`Invalid ID: ${params.id}`));
    }
    return httpClient(`${apiBasePath}/${id}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json }));
  },

  getMany: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    return httpClient(`${apiBasePath}?filter=${JSON.stringify({ id: params.ids })}`)
      .then(({ json }) => ({ data: json.data || json }));
  },

  getManyReference: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    const filter = { ...params.filter, [params.target]: params.id };
    return httpClient(`${apiBasePath}?filter=${JSON.stringify(filter)}`)
      .then(({ json }) => ({
        data: json.data || json,
        total: json.total || (json.data ? json.data.length : json.length),
      }));
  },

  updateMany: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    return Promise.all(
      params.ids.map(id =>
        httpClient(`${apiBasePath}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        }).then(({ json }) => json)
      )
    ).then(responses => ({ data: responses }));
  },

  deleteMany: (resource, params) => {
    const apiBasePath = getApiBasePath(resource);
    return Promise.all(
      params.ids.map(id =>
        httpClient(`${apiBasePath}/${id}`, {
          method: 'DELETE',
        }).then(({ json }) => json)
      )
    ).then(responses => ({ data: responses }));
  },

  // Кастомные методы для article_tags

  getArticleTags: async (articleId) => {
    const url = `${getApiBasePath('articles')}/${articleId}/tags`;
    const { json } = await httpClient(url);
    return { data: json };
  },

  createArticleTag: async ({ article_id, tag_id }) => {
    const url = getApiBasePath('article_tags');
    const options = {
      method: 'POST',
      body: JSON.stringify({ article_id, tag_id }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
    const { json } = await httpClient(url, options);
    return { data: json };
  },

  deleteArticleTag: async ({ article_id, tag_id }) => {
    const url = getApiBasePath('article_tags');
    const options = {
      method: 'DELETE',
      body: JSON.stringify({ article_id, tag_id }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
    const { json } = await httpClient(url, options);
    return { data: json };
  },
};

export default dataProvider;
