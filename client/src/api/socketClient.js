import { io } from 'socket.io-client';
import { API_URL } from './axiosClient';

// A single shared socket for the whole app — created once, reused by
// every component via useSocket(), rather than each component opening
// its own connection.
const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
});

export default socket;
