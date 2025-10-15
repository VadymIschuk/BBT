export const ACCESS_TOKEN = "access";
export const REFRESH_TOKEN = "refresh";


export const API_PREFIX = "/api/v1"; 
export const ENDPOINTS = {
  login:    `${API_PREFIX}/token/`,
  refresh:  `${API_PREFIX}/auth/refresh/`,
  register: `${API_PREFIX}/auth/register/`,
  logout:   `${API_PREFIX}/auth/logout/`,
  me: `${API_PREFIX}/auth/me/`,
  reports: {
    list:   `${API_PREFIX}/reports/`,
    create: `${API_PREFIX}/reports/create/`,
    mine:   `${API_PREFIX}/reports/mine/`,
    detail: (id) => `${API_PREFIX}/reports/${id}/`,
    del:    (id) => `${API_PREFIX}/reports/${id}/delete/`,
  }
};
