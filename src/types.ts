export interface Vehicle {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  fuelEfficiency: number; // MPG
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  institution: string; // e.g., "Stanford University", "Google Inc."
  role: 'student' | 'employee';
  institutionalIdNumber: string;
  isVerified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  mfaEnabled: boolean;
  vehicle?: Vehicle;
  rating: number;
  ridesCompleted: number;
}

export type Geopoint = {
  lat: number;
  lng: number;
  name: string;
};

export interface Route {
  id: string;
  name: string;
  points: Geopoint[];
}

export interface RideJourney {
  id: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverInstitution: string;
  driverEmail: string;
  vehicle: Vehicle;
  origin: Geopoint;
  destination: Geopoint;
  routePath: string; // Key of pre-defined map paths
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  estimatedFuelMpg: number;
  totalEstimatedFuelCost: number; // calculated Based on gas price ($4.20/gal) and distance
  distanceMiles: number;
  passengers: UserProfile[];
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface RiderRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderAvatar: string;
  riderInstitution: string;
  origin: Geopoint;
  destination: Geopoint;
  routePath: string;
  departureDate: string;
  departureTime: string;
  requestedSeats: number;
  status: 'pending' | 'matched' | 'declined';
}

export interface RouteMatchResult {
  rideId: string;
  riderRequestId: string;
  overlapPercentage: number; // e.g., 85%
  overlapMiles: number;
  sharedRouteSegments: string[]; // Segment names, e.g., ["Highway 101 N", "University Ave"]
  co2SavedLbs: number;
  fuelCostSavedDollars: number;
  individualCostShare: number;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  type: 'match_accepted' | 'new_message';
  title: string;
  desc: string;
  timestamp: string;
  isRead: boolean;
  linkId?: string; // Optional rideId or requestId link
}
