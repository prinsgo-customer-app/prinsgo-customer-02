import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket: ReturnType<typeof io> | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
  }
  return socket;
};

export const joinRideRoom = (rideId) => {
  getSocket().emit('join_ride_room', rideId);
};

export const joinParcelRoom = (parcelId) => {
  getSocket().emit('join_parcel_room', parcelId);
};

export const onDriverLocation = (callback) => {
  getSocket().on('driver_location', callback);
  return () => getSocket().off('driver_location', callback);
};
