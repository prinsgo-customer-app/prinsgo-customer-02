import AsyncStorage from '@react-native-async-storage/async-storage';

// आपका लाइव Render बैकएंड URL सेट कर दिया गया है
const API_BASE_URL = 'https://prinsgo-backend.onrender.com/api';

export const bookRideApi = async ({
  pickupAddress,
  pickupLat,
  pickupLng,
  dropAddress,
  dropLat,
  dropLng,
  vehicleType,
  paymentMethod = 'cash',
}) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      throw new Error('Authentication token missing. Please log in again.');
    }

    const payload = {
      pickup: {
        address: String(pickupAddress),
        lat: Number(pickupLat),
        lng: Number(pickupLng),
      },
      drop: {
        address: String(dropAddress),
        lat: Number(dropLat),
        lng: Number(dropLng),
      },
      vehicleType: String(vehicleType),
      paymentMethod: String(paymentMethod),
    };

    const response = await fetch(`${API_BASE_URL}/rides/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to book ride');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
