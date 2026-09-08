import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

export const getTransactions = () => API.get('/transactions');
export const createTransaction = (data) => API.post('/transactions', data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);