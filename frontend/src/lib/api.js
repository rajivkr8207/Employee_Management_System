import axios from 'axios'
import { Config } from '../config/Config';

export const api = axios.create({
  baseURL: Config.BACKEND_URL,
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});