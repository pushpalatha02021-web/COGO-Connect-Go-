import { UserProfile, RideJourney, RiderRequest, RouteMatchResult, Message } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user_driver_1',
    name: 'Kavitha Reddy',
    email: 'kavitha.reddy@iiit.ac.in',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    institution: 'IIIT Hyderabad',
    role: 'student',
    institutionalIdNumber: 'IIIT-502847',
    isVerified: true,
    verificationStatus: 'verified',
    mfaEnabled: true,
    rating: 4.9,
    ridesCompleted: 42,
    vehicle: {
      make: 'Tata',
      model: 'Nexon EV',
      year: '2023',
      licensePlate: 'TS09EF1294',
      fuelEfficiency: 15 // km/L cost equivalent
    }
  },
  {
    id: 'user_driver_2',
    name: 'Srinivas Rao',
    email: 'srinivas.rao@google.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    institution: 'Google Hyderabad',
    role: 'employee',
    institutionalIdNumber: 'GO-HYD-5002',
    isVerified: true,
    verificationStatus: 'verified',
    mfaEnabled: true,
    rating: 4.8,
    ridesCompleted: 104,
    vehicle: {
      make: 'Maruti Suzuki',
      model: 'Grand Vitara',
      year: '2022',
      licensePlate: 'TS07HK8112',
      fuelEfficiency: 18 // km/L
    }
  },
  {
    id: 'user_driver_3',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@iith.ac.in',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    institution: 'IIT Hyderabad',
    role: 'employee',
    institutionalIdNumber: 'IITH-FAC-771',
    isVerified: true,
    verificationStatus: 'verified',
    mfaEnabled: true,
    rating: 4.95,
    ridesCompleted: 18,
    vehicle: {
      make: 'Hyundai',
      model: 'i20',
      year: '2021',
      licensePlate: 'TS08PL4900',
      fuelEfficiency: 16
    }
  },
  {
    id: 'user_rider_1',
    name: 'Avinash',
    email: 'avinash@iiit.ac.in',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    institution: 'IIIT Hyderabad',
    role: 'student',
    institutionalIdNumber: 'IIIT-114289',
    isVerified: true,
    verificationStatus: 'verified',
    mfaEnabled: true,
    rating: 4.7,
    ridesCompleted: 15
  },
  {
    id: 'user_rider_2',
    name: 'Priya Patel',
    email: 'priya.patel@google.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    institution: 'Google Hyderabad',
    role: 'employee',
    institutionalIdNumber: 'GO-HYD-8849',
    isVerified: true,
    verificationStatus: 'verified',
    mfaEnabled: true,
    rating: 4.9,
    ridesCompleted: 54
  },
  {
    id: 'user_rider_3',
    name: 'Rahul Verma',
    email: 'rahul.verma@iith.ac.in',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    institution: 'IIT Hyderabad',
    role: 'student',
    institutionalIdNumber: 'IITH-88319',
    isVerified: false,
    verificationStatus: 'unverified',
    mfaEnabled: false,
    rating: 5.0,
    ridesCompleted: 0
  }
];

// Custom 2D SVG coordinates mock of Hyderabad to draw on our dynamic dashboard map
export interface MapNode {
  id: string;
  name: string;
  x: number; // SVG pixel coordinate X (relative scale matching visually)
  y: number; // SVG pixel coordinate Y (relative scale matching visually)
  lat: number;
  lng: number;
  type: 'university' | 'tech_hub' | 'airport' | 'transit' | 'suburb';
}

export const MAP_NODES: MapNode[] = [
  { id: 'bits_hyd', name: 'BITS Pilani Hyderabad Campus', x: 250, y: 40, lat: 17.5450, lng: 78.5717, type: 'university' },
  { id: 'secunderabad', name: 'Secunderabad Junction Metro', x: 200, y: 130, lat: 17.4343, lng: 78.5021, type: 'transit' },
  { id: 'jubilee_hills', name: 'Jubilee Hills Precinct', x: 170, y: 160, lat: 17.4300, lng: 78.4090, type: 'suburb' },
  { id: 'begumpet', name: 'Begumpet Airport Zone', x: 190, y: 240, lat: 17.4485, lng: 78.4616, type: 'transit' },
  { id: 'madhapur', name: 'Madhapur Tech Precinct', x: 210, y: 310, lat: 17.4480, lng: 78.3840, type: 'tech_hub' },
  { id: 'hitec_city_metro', name: 'Hitec City Metro Station', x: 240, y: 380, lat: 17.4435, lng: 78.3773, type: 'tech_hub' },
  { id: 'iiit_hyd', name: 'IIIT Hyderabad Campus', x: 260, y: 440, lat: 17.4448, lng: 78.3498, type: 'university' },
  { id: 'gachibowli', name: 'Gachibowli Circle (Transit)', x: 275, y: 420, lat: 17.4400, lng: 78.3480, type: 'transit' },
  { id: 'google_hyd', name: 'Google Hyderabad (Kondapur)', x: 310, y: 490, lat: 17.4566, lng: 78.3615, type: 'tech_hub' },
  { id: 'kondapur', name: 'Kondapur Botanical Garden', x: 340, y: 530, lat: 17.4610, lng: 78.3550, type: 'suburb' },
  { id: 'jntu', name: 'JNTU Hyderabad Campus', x: 380, y: 560, lat: 17.4933, lng: 78.3917, type: 'university' },
  { id: 'rgi_airport', name: 'Shamshabad RGI Airport (HYD)', x: 420, y: 600, lat: 17.2403, lng: 78.4294, type: 'airport' }
];

// Beautiful Hyderabad connections for visual presentation
export interface MapConnection {
  from: string;
  to: string;
  label: string;
  distance: number; // in km
}

export const MAP_CONNECTIONS: MapConnection[] = [
  { from: 'bits_hyd', to: 'secunderabad', label: 'Rajiv Rahadari NH-355', distance: 22.5 },
  { from: 'secunderabad', to: 'jubilee_hills', label: 'Secunderabad Flyover Rd', distance: 9.2 },
  { from: 'jubilee_hills', to: 'begumpet', label: 'Road No. 36 Jubilee Hills', distance: 6.8 },
  { from: 'begumpet', to: 'madhapur', label: 'Begumpet Airport Flyover', distance: 8.4 },
  { from: 'madhapur', to: 'hitec_city_metro', label: 'Hitec City Corridor Link', distance: 2.1 },
  { from: 'hitec_city_metro', to: 'gachibowli', label: 'Gachibowli-Miyapur Road', distance: 4.2 },
  { from: 'gachibowli', to: 'iiit_hyd', label: 'IIIT Main Road', distance: 1.2 },
  { from: 'iiit_hyd', to: 'google_hyd', label: 'Wipro Circle Link', distance: 3.1 },
  { from: 'google_hyd', to: 'kondapur', label: 'Botanical Garden Rd', distance: 1.5 },
  { from: 'kondapur', to: 'jntu', label: 'Miyapur-Kondapur Road', distance: 6.5 },
  { from: 'jntu', to: 'rgi_airport', label: 'Nehru Outer Ring Road (ORR)', distance: 38.0 }
];

export const PATH_ROUTES: Record<string, string[]> = {
  stanford_to_sf: ['iiit_hyd', 'gachibowli', 'hitec_city_metro', 'madhapur', 'begumpet', 'secunderabad'],
  palo_alto_to_sf_mission: ['gachibowli', 'hitec_city_metro', 'madhapur', 'begumpet', 'jubilee_hills'],
  redwood_to_sfo: ['hitec_city_metro', 'madhapur', 'begumpet'],
  san_jose_to_googleplex: ['rgi_airport', 'jntu', 'kondapur', 'google_hyd'],
  santa_clara_to_sunnyvale: ['jntu', 'kondapur'],
  berkeley_to_sf: ['bits_hyd', 'secunderabad'],
  stanford_to_googleplex: ['iiit_hyd', 'gachibowli', 'google_hyd']
};

export const MOCK_RIDES: RideJourney[] = [
  {
    id: 'ride_1',
    driverId: 'user_driver_1',
    driverName: 'Kavitha Reddy',
    driverAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    driverInstitution: 'IIIT Hyderabad',
    driverEmail: 'kavitha.reddy@iiit.ac.in',
    vehicle: {
      make: 'Tata',
      model: 'Nexon EV',
      year: '2023',
      licensePlate: 'TS09EF1294',
      fuelEfficiency: 15 // km/L equivalent
    },
    origin: { lat: 17.4448, lng: 78.3498, name: 'IIIT Hyderabad' },
    destination: { lat: 17.4343, lng: 78.5021, name: 'Secunderabad Station' },
    routePath: 'stanford_to_sf',
    departureDate: '2026-05-26',
    departureTime: '08:15 AM',
    totalSeats: 4,
    availableSeats: 3,
    estimatedFuelMpg: 15,
    totalEstimatedFuelCost: 150.00, // INR
    distanceMiles: 22.0, // Treat metric in km in UI label but keep raw key structure compatible
    passengers: [],
    status: 'scheduled'
  },
  {
    id: 'ride_2',
    driverId: 'user_driver_2',
    driverName: 'Srinivas Rao',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    driverInstitution: 'Google Hyderabad',
    driverEmail: 'srinivas.rao@google.com',
    vehicle: {
      make: 'Maruti Suzuki',
      model: 'Grand Vitara',
      year: '2022',
      licensePlate: 'TS07HK8112',
      fuelEfficiency: 18
    },
    origin: { lat: 17.2403, lng: 78.4294, name: 'Shamshabad RGI Airport' },
    destination: { lat: 17.4566, lng: 78.3615, name: 'Google Hyderabad (Kondapur)' },
    routePath: 'san_jose_to_googleplex',
    departureDate: '2026-05-26',
    departureTime: '07:45 AM',
    totalSeats: 3,
    availableSeats: 3,
    estimatedFuelMpg: 18,
    totalEstimatedFuelCost: 230.00, // INR
    distanceMiles: 34.0,
    passengers: [],
    status: 'scheduled'
  }
];

export const MOCK_RIDER_REQUESTS: RiderRequest[] = [
  {
    id: 'req_1',
    riderId: 'user_rider_1',
    riderName: 'Avinash',
    riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    riderInstitution: 'IIIT Hyderabad',
    origin: { lat: 17.4400, lng: 78.3480, name: 'Gachibowli Circle (Transit)' },
    destination: { lat: 17.4300, lng: 78.4090, name: 'Jubilee Hills Precinct' },
    routePath: 'palo_alto_to_sf_mission',
    departureDate: '2026-05-26',
    departureTime: '08:20 AM',
    requestedSeats: 1,
    status: 'pending'
  },
  {
    id: 'req_2',
    riderId: 'user_rider_2',
    riderName: 'Priya Patel',
    riderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    riderInstitution: 'Google Hyderabad',
    origin: { lat: 17.4435, lng: 78.3773, name: 'Hitec City Metro Station' },
    destination: { lat: 17.4485, lng: 78.4616, name: 'Begumpet Airport Zone' },
    routePath: 'redwood_to_sfo',
    departureDate: '2026-05-26',
    departureTime: '08:30 AM',
    requestedSeats: 1,
    status: 'pending'
  },
  {
    id: 'req_3',
    riderId: 'user_rider_3',
    riderName: 'Rahul Verma',
    riderAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    riderInstitution: 'IIT Hyderabad',
    origin: { lat: 17.4933, lng: 78.3917, name: 'JNTU Hyderabad Campus' },
    destination: { lat: 17.4610, lng: 78.3550, name: 'Kondapur Botanical Garden' },
    routePath: 'santa_clara_to_sunnyvale',
    departureDate: '2026-05-26',
    departureTime: '07:50 AM',
    requestedSeats: 1,
    status: 'pending'
  }
];

// Overlap percentage & Indian cost share results
export const INITIAL_MATCHES: RouteMatchResult[] = [
  {
    rideId: 'ride_1',
    riderRequestId: 'req_1',
    overlapPercentage: 91,
    overlapMiles: 20.0,
    sharedRouteSegments: ['Gachibowli Circle', 'Hitec City Metro Station', 'Madhapur Tech', 'Begumpet Airport Area'],
    co2SavedLbs: 27.5,
    fuelCostSavedDollars: 135.00, // INR savings
    individualCostShare: 75.00 // INR Gachibowli to Begumpet
  },
  {
    rideId: 'ride_1',
    riderRequestId: 'req_2',
    overlapPercentage: 45,
    overlapMiles: 10.5,
    sharedRouteSegments: ['Hitec City Metro Station', 'Madhapur Tech', 'Begumpet Airport Area'],
    co2SavedLbs: 13.5,
    fuelCostSavedDollars: 70.00, // INR savings
    individualCostShare: 35.00 // INR midway
  },
  {
    rideId: 'ride_2',
    riderRequestId: 'req_3',
    overlapPercentage: 65,
    overlapMiles: 6.5,
    sharedRouteSegments: ['JNTU Hyderabad', 'Kondapur Botanical Garden'],
    co2SavedLbs: 6.8,
    fuelCostSavedDollars: 45.00,
    individualCostShare: 22.50
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    rideId: 'ride_1',
    senderId: 'user_driver_1',
    senderName: 'Kavitha Reddy',
    text: 'Hey! I will be starting from the IIIT Hyderabad main gate at 8:15 AM. Let me know if you want to be picked up at Vindhya Block or Gachibowli Circle.',
    timestamp: '2026-05-25T18:30:00Z'
  },
  {
    id: 'm2',
    rideId: 'ride_1',
    senderId: 'user_rider_1',
    senderName: 'Avinash',
    text: 'Vindhya Block works perfectly for me! I am right next to the Nilgiri Block. I will bring you a warm Irani Chai from DLF!',
    timestamp: '2026-05-25T18:35:00Z'
  }
];
