export interface LocationCoords {
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
}
export interface Place {
  placeId?: string;
  place_id?: string;
  description?: string;
  address?: string;
}
export interface RideEstimate {
  vehicleType: string;
  durationMin: number;
  totalFare: number;
}
export interface Ride {
  _id: string;
  status: string;
  createdAt: string;
  pickupAddress?: string;
  dropAddress?: string;
  distanceKm?: number;
  durationMin?: number;
  fare?: number;
  pickup?: { address: string; lat: number; lng: number; };
  drop?: { address: string; lat: number; lng: number; };
  vehicleType?: string;
  paymentMethod?: string;
}
export interface Parcel {
  _id: string;
  status: string;
  createdAt: string;
  pickupAddress?: string;
  dropAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  category?: string;
  fare?: number;
  pickup?: { contactName?: string; address?: string };
  drop?: { contactName?: string; address?: string };
  charges?: { baseCharge?: number; distanceCharge?: number; totalCharge?: number };
  paymentMethod?: string;
}
