import apiClient from './client';


// Get fare estimate before booking
export const estimateFare = (
  pickupLat,
  pickupLng,
  dropLat,
  dropLng
) =>
  apiClient.post('/rides/estimate', {
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
  });


// Book new ride
// Data format:
// {
//   pickup:{ address, lat, lng },
//   drop:{ address, lat, lng },
//   vehicleType,
//   paymentMethod
// }

export const bookRide = (data) =>
  apiClient.post('/rides/book', data);


// Get current active ride
export const getActiveRide = () =>
  apiClient.get('/rides/active');


// Get ride details by ID
export const getRideById = (id) =>
  apiClient.get(`/rides/${id}`);


// Ride history
export const getRideHistory = (
  page = 1,
  limit = 20
) =>
  apiClient.get(
    `/rides/history?page=${page}&limit=${limit}`
  );


// Cancel ride
export const cancelRide = (
  id,
  reason
) =>
  apiClient.put(
    `/rides/${id}/cancel`,
    { reason }
  );


// Rate completed ride
export const rateRide = (
  id,
  rating,
  review
) =>
  apiClient.post(
    `/rides/${id}/rate`,
    {
      rating,
      review,
    }
  );
