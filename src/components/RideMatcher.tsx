import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RideJourney, RiderRequest, RouteMatchResult, Message, UserProfile } from '../types';
import { MOCK_USERS, MOCK_RIDES, MOCK_RIDER_REQUESTS, INITIAL_MATCHES, MOCK_MESSAGES, MAP_NODES, PATH_ROUTES } from '../data';
import { 
  publishDriverRide, 
  fetchActiveRides, 
  publishPassengerRequest, 
  executeSpatialCorridorSearch, 
  subscribeToRideChat, 
  sendChatMessage, 
  writeDriverCoordinate, 
  subscribeToDriverTracking, 
  setRideCorridorStatus 
} from '../lib/firebaseService';
import {
  Car, Calendar, Clock, MapPin, Users, Flame, Info, Check, Send, AlertTriangle,
  Coins, MessageSquare, ChevronRight, Award, Plus, Sparkles, Footprints, ShieldCheck
} from 'lucide-react';

interface RideMatcherProps {
  currentUser: UserProfile;
  selectedRide: RideJourney | null;
  selectedRequest: RiderRequest | null;
  activeMatch: RouteMatchResult | null;
  onSelectRide: (ride: RideJourney | null) => void;
  onSelectRequest: (req: RiderRequest | null) => void;
  onSelectMatch: (match: RouteMatchResult | null) => void;
  onAddNotification?: (type: 'match_accepted' | 'new_message', title: string, desc: string, linkId?: string) => void;
}

export default function RideMatcher({
  currentUser,
  selectedRide,
  selectedRequest,
  activeMatch,
  onSelectRide,
  onSelectRequest,
  onSelectMatch,
  onAddNotification
}: RideMatcherProps) {
  // Local reactive states
  const [rides, setRides] = useState<RideJourney[]>(MOCK_RIDES);
  const [requests, setRequests] = useState<RiderRequest[]>(MOCK_RIDER_REQUESTS);
  const [matches, setMatches] = useState<RouteMatchResult[]>(INITIAL_MATCHES);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [currentChatText, setCurrentChatText] = useState('');

  // Fuel share calculation configs
  const [gasPrice, setGasPrice] = useState<number>(100.0); // Price per Litre (₹)
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRideModal, setShowCreateRideModal] = useState(false);

  // Form states for creating a ride
  const [newOrigin, setNewOrigin] = useState('IIIT Hyderabad');
  const [newDest, setNewDest] = useState('Secunderabad Station');
  const [newDate, setNewDate] = useState('2026-05-26');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newSeats, setNewSeats] = useState(4);
  const [mpgInput, setMpgInput] = useState(15);

  // Load and subscribe to active rides on startup & periodically
  useEffect(() => {
    let active = true;
    const syncData = async () => {
      const liveRides = await fetchActiveRides();
      if (active && liveRides && liveRides.length > 0) {
        setRides(liveRides);
      }
    };
    
    syncData();
    const timer = setInterval(syncData, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Sync coordination chat room in real-time when a ride is selected
  useEffect(() => {
    if (!selectedRide) return;

    const unsubscribe = subscribeToRideChat(selectedRide.id, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedRide?.id]);

  // Simulating live telemetry coordinates to Firebase every 3 seconds when ongoing
  useEffect(() => {
    if (!selectedRide || selectedRide.status !== 'ongoing') return;

    const pathNodes = PATH_ROUTES[selectedRide.routePath] || [];
    if (pathNodes.length === 0) return;

    let nodeIdx = 0;
    const timer = setInterval(() => {
      const nodeId = pathNodes[nodeIdx];
      const nodeObj = MAP_NODES.find(n => n.id === nodeId);
      if (nodeObj) {
        // Stream O(1) GPS coordinate updates to live Firestore db / fallback
        writeDriverCoordinate(selectedRide.id, nodeObj.lat, nodeObj.lng);
      }
      nodeIdx = (nodeIdx + 1) % pathNodes.length;
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedRide?.id, selectedRide?.status]);

  const handleSelectRide = (ride: RideJourney) => {
    onSelectRide(ride);
    
    // Auto-select a corresponding request matching this ride if any exists
    const matchingRelation = matches.find(m => m.rideId === ride.id);
    if (matchingRelation) {
      const correspondingReq = requests.find(r => r.id === matchingRelation.riderRequestId);
      if (correspondingReq) {
        onSelectRequest(correspondingReq);
        onSelectMatch(matchingRelation);
        return;
      }
    }
    
    onSelectRequest(null);
    onSelectMatch(null);
  };

  const handleCreateRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isVerified) {
      alert("Please verify your institutional email in the Security panel first!");
      return;
    }

    const originNode = MAP_NODES.find(n => n.name === newOrigin || n.id === newOrigin) || MAP_NODES.find(n => n.id === 'iiit_hyd')!;
    const destNode = MAP_NODES.find(n => n.name === newDest || n.id === newDest) || MAP_NODES.find(n => n.id === 'secunderabad')!;
    const distanceKm = 22.0; 
    const estimatedCost = parseFloat(((distanceKm / mpgInput) * gasPrice).toFixed(2));

    const newRide: RideJourney = {
      id: `ride_${Date.now()}`,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverAvatar: currentUser.avatarUrl,
      driverInstitution: currentUser.institution || 'Institutional Peer',
      driverEmail: currentUser.email,
      vehicle: currentUser.vehicle || {
        make: 'Tata',
        model: 'Altroz',
        year: '2022',
        licensePlate: 'TS09EF3349',
        fuelEfficiency: mpgInput
      },
      origin: { lat: originNode.lat, lng: originNode.lng, name: originNode.name },
      destination: { lat: destNode.lat, lng: destNode.lng, name: destNode.name },
      routePath: 'stanford_to_sf',
      departureDate: newDate,
      departureTime: newTime,
      totalSeats: newSeats,
      availableSeats: newSeats,
      estimatedFuelMpg: mpgInput,
      totalEstimatedFuelCost: estimatedCost,
      distanceMiles: distanceKm,
      passengers: [],
      status: 'scheduled'
    };

    publishDriverRide(newRide).then(() => {
      setRides([newRide, ...rides]);
      onSelectRide(newRide);
      setShowCreateRideModal(false);
      if (onAddNotification) {
        onAddNotification('match_accepted', 'Ride Posted 🚗', `Your route to ${newRide.destination.name} is active in Firebase.`, newRide.id);
      }
    });
  };

  const handleAcceptMatch = (match: RouteMatchResult) => {
    // Modify states representing Firebase write trigger
    const ride = rides.find(r => r.id === match.rideId);
    const req = requests.find(r => r.id === match.riderRequestId);
    
    if (ride && req && ride.availableSeats > 0) {
      // Deduct passenger seat, append passenger to listing
      const passengerUser: UserProfile = MOCK_USERS.find(user => user.id === req.riderId) || {
        id: req.riderId,
        name: req.riderName,
        avatarUrl: req.riderName.includes('Avinash') ? MOCK_USERS[3].avatarUrl : MOCK_USERS[4].avatarUrl,
        email: 'pass@inst.edu',
        institution: req.riderInstitution,
        role: 'student',
        isVerified: true,
        verificationStatus: 'verified',
        mfaEnabled: true,
        rating: 4.8,
        ridesCompleted: 5,
        institutionalIdNumber: 'UN-902'
      };

      const updatedRides = rides.map(r => {
        if (r.id === ride.id) {
          return {
            ...r,
            availableSeats: r.availableSeats - 1,
            passengers: [...r.passengers, passengerUser]
          };
        }
        return r;
      });

      const updatedRequests = requests.map(rq => {
        if (rq.id === req.id) {
          return { ...rq, status: 'matched' as const };
        }
        return rq;
      });

      setRides(updatedRides);
      setRequests(updatedRequests);
      
      // Update local selection
      const activeSelectedRide = updatedRides.find(r => r.id === ride.id) || null;
      const activeSelectedReq = updatedRequests.find(r => r.id === req.id) || null;
      onSelectRide(activeSelectedRide);
      onSelectRequest(activeSelectedReq);

      // Create message notification
      const systemMessage: Message = {
        id: `msys-${Date.now()}`,
        rideId: ride.id,
        senderId: 'system',
        senderName: 'COGO Match Bot',
        text: `Match approved! ${req.riderName} has joined ${ride.driverName}'s P2P pool. Fuel split optimized dynamically.`,
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, systemMessage]);

      if (onAddNotification) {
        onAddNotification(
          'match_accepted',
          'Match Approved 🎉',
          `${req.riderName} was added to ${ride.driverName}'s pool!`,
          ride.id
        );
      }
    }
  };

  // Chat message submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatText.trim() || !selectedRide) return;

    const msgText = currentChatText;
    setCurrentChatText('');

    sendChatMessage(selectedRide.id, currentUser.id, currentUser.name, msgText).then((newMsg) => {
      if (onAddNotification) {
        onAddNotification(
          'new_message',
          'Message Sent 📨',
          `Channel ${selectedRide.driverName}: "${msgText}"`,
          selectedRide.id
        );
      }

      // Interactive reply automation after 2.5 seconds
      const replies = [
        "Sounds great, looking forward to the pool! 👍",
        "Perfect! I will reach Gachibowli circle in 10 minutes.",
        "Got it. I'm near the pickup point, look for the vehicle.",
        "Yes, fuel split is confirmed. See you!",
        "I'm on my way as well, drive safely!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const otherPassenger = selectedRide.passengers[0] || { name: selectedRide.driverName, id: selectedRide.driverId };

      setTimeout(() => {
        sendChatMessage(selectedRide.id, otherPassenger.id, otherPassenger.name, randomReply).then(() => {
          if (onAddNotification) {
            onAddNotification(
              'new_message',
              `Message from ${otherPassenger.name} 💬`,
              `"${randomReply}"`,
              selectedRide.id
            );
          }
        });
      }, 2500);
    });
  };

  // Filter rides based on search queries
  const filteredRides = rides.filter(ride => 
    ride.origin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic cost helper
  const calculateFuelSplit = (ride: RideJourney) => {
    const totalOccupants = 1 + ride.passengers.length; // Driver + passenger count
    const splitPrice = ride.totalEstimatedFuelCost / totalOccupants;
    const standardCostEstimate = ride.distanceMiles * 20.0; // standard commercial cab rate (₹20 per km)

    return {
      splitPrice: Math.round(splitPrice).toString(),
      driverSaves: Math.round(ride.totalEstimatedFuelCost - splitPrice).toString(),
      uberPricingEquiv: Math.round(standardCostEstimate).toString(),
      discountPercentage: Math.round(((standardCostEstimate - splitPrice) / standardCostEstimate) * 100)
    };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Search and Rides List (Left Rail) */}
      <div className="xl:col-span-4 space-y-4">
        {/* Search corridor input */}
        <div className="bg-[#161618] border border-zinc-800 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Car className="w-4 h-4 text-cyan-400" />
              Active Commutes
            </h3>
            <button
              onClick={() => setShowCreateRideModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Post Commute
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter by IIIT, Gachibowli, Google..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-zinc-805 focus:border-cyan-500 focus:outline-none text-zinc-350 text-xs py-2 px-3 rounded-xl pr-8"
            />
          </div>
        </div>

        {/* List of Driver Rides */}
        <div className="space-y-3">
          {filteredRides.map(ride => {
            const isSelected = selectedRide?.id === ride.id;
            const splitSummary = calculateFuelSplit(ride);
            
            return (
              <div
                key={ride.id}
                onClick={() => handleSelectRide(ride)}
                className={`p-4 border rounded-2xl cursor-pointer transition shadow-md ${
                  isSelected 
                    ? 'bg-[#161618] border-cyan-500 ring-1 ring-cyan-500/40' 
                    : 'bg-[#161618] border-zinc-805 hover:border-zinc-700 bg-opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={ride.driverAvatar}
                      alt={ride.driverName}
                      className="w-9 h-9 object-cover rounded-full border border-zinc-800"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1 leading-tight">
                        {ride.driverName}
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" title="Institution Verified" />
                      </h4>
                      <p className="text-[10px] text-zinc-400 leading-none mt-1">{ride.driverInstitution}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-zinc-500 font-mono block">Fuel Share basis</span>
                    <span className="text-xs font-bold font-mono text-cyan-400">₹{splitSummary.splitPrice} per head</span>
                  </div>
                </div>

                {/* Locations Corridor */}
                <div className="mt-3.5 space-y-1.5 border-l border-zinc-800 pl-3 ml-2 text-xs relative">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <span className="absolute left-[-5px] top-[4px] w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-950" />
                    <span className="font-semibold truncate max-w-[170px]">{ride.origin.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <span className="absolute left-[-5px] top-[24px] w-2.5 h-2.5 rounded-full bg-cyan-500 border border-zinc-950 animate-pulse" />
                    <span className="truncate max-w-[170px] font-medium">{ride.destination.name}</span>
                  </div>
                </div>

                {/* Ride Stats Icons Row */}
                <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 gap-2">
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {ride.departureTime}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{ride.availableSeats} of {ride.totalSeats} seats open</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Match Center Details (Center & Right) */}
      <div className="xl:col-span-8 space-y-6">
        {selectedRide ? (
          <div className="bg-[#161618] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Split Header */}
            <div className="bg-gradient-to-r from-[#161618] via-[#0F0F11] to-cyan-950/20 px-6 py-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedRide.driverAvatar}
                  alt={selectedRide.driverName}
                  className="w-12 h-12 object-cover rounded-full border-2 border-cyan-500/60"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    {selectedRide.driverName}'s P2P Pool
                    <span className="text-[10px] font-mono font-bold bg-cyan-950/50 text-cyan-400 border border-cyan-850/60 px-2.5 py-0.5 rounded-full">
                      DRIVER {selectedRide.vehicle.make}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Route matches regional corridors overlapping with {selectedRide.driverInstitution} commutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Total Est. Fuel Cost</span>
                  <span className="text-lg font-bold font-mono text-zinc-200">₹{selectedRide.totalEstimatedFuelCost}</span>
                </div>
              </div>
            </div>

            {/* Driver Secure Operations Console */}
            {selectedRide.driverId === currentUser.id && (
              <div className="bg-[#1C1917]/30 border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${selectedRide.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : selectedRide.status === 'completed' ? 'bg-zinc-800 text-zinc-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#eab308] font-bold">Driver Action Panel</span>
                    <h5 className="font-bold text-xs text-white">
                      Commute State: {selectedRide.status.toUpperCase()}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRide.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        setRideCorridorStatus(selectedRide.id, 'ongoing');
                        if (onAddNotification) {
                          onAddNotification(
                            'match_accepted', 
                            'Commute Initialized 🗺️', 
                            'Live GPS coordinate stream enabled for your peer passengers.', 
                            selectedRide.id
                          );
                        }
                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-cyan-600 cursor-pointer transition-all shadow"
                    >
                      Start Commute Service
                    </button>
                  )}

                  {selectedRide.status === 'ongoing' && (
                    <button
                      onClick={() => {
                        setRideCorridorStatus(selectedRide.id, 'completed');
                        if (onAddNotification) {
                          onAddNotification(
                            'match_accepted', 
                            'Destination Arrived 🏁', 
                            'Commute successfully completed! Logging out of high-trust session.', 
                            selectedRide.id
                          );
                        }
                        // Step 4: Completion - Trip is completed, logs out session after 4.5 seconds
                        setTimeout(() => {
                          localStorage.removeItem('cogo_logged_in_user');
                          window.location.reload(); 
                        }, 4500);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-emerald-600 cursor-pointer transition-all shadow animate-pulse"
                    >
                      Arrived at Destination
                    </button>
                  )}

                  {selectedRide.status === 'completed' && (
                    <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 bg-[#0A0A0B] px-3 py-1 rounded-lg">
                      Session Terminated Successfully
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Ride Details Grid */}
            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-800">
              {/* Overlapping paths analytics */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Journey Dynamics</h4>
                
                <div className="bg-[#0A0A0B]/80 border border-zinc-800/80 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Departure Time</span>
                    <span className="font-semibold font-mono text-zinc-200">{selectedRide.departureDate} @ {selectedRide.departureTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Total Corridor Length</span>
                    <span className="font-semibold font-mono text-zinc-200">{selectedRide.distanceMiles} km</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-555">Vehicle Mileage basis</span>
                    <span className="font-semibold font-mono text-zinc-200">{selectedRide.vehicle.fuelEfficiency} km/L ({selectedRide.vehicle.model})</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-550">Current Occupants</span>
                    <span className="font-semibold text-emerald-400">1 Driver + {selectedRide.passengers.length} Pas.</span>
                  </div>
                </div>

                {/* Subsegment Pickups */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">P2P Route Match Matches</h4>
                  <div className="space-y-2">
                    {requests
                      .filter(rq => {
                        const relMatch = matches.find(m => m.rideId === selectedRide.id && m.riderRequestId === rq.id);
                        return !!relMatch;
                      })
                      .map(rq => {
                        const relMatch = matches.find(m => m.rideId === selectedRide.id && m.riderRequestId === rq.id)!;
                        const isApproved = rq.status === 'matched';

                        return (
                          <div
                            key={rq.id}
                            className={`p-3 border rounded-xl flex items-center justify-between text-xs transition duration-200 ${
                              isApproved 
                                ? 'bg-emerald-955/20 border-emerald-900/60' 
                                : 'bg-[#0A0A0B]/60 border-zinc-800 hover:border-zinc-750'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={rq.riderAvatar} alt={rq.riderName} className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                              <div>
                                <h5 className="font-semibold text-zinc-200 flex items-center gap-1">{rq.riderName}</h5>
                                <p className="text-[10px] text-zinc-400">{rq.riderInstitution} ({relMatch.overlapPercentage}% Path Overlap)</p>
                              </div>
                            </div>
                            
                            <div>
                              {isApproved ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> BOUND IN POOL
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAcceptMatch(relMatch)}
                                  disabled={selectedRide.availableSeats === 0}
                                  className={`font-semibold text-[10px] py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                    selectedRide.availableSeats === 0
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                      : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-600 text-black font-bold'
                                  }`}
                                >
                                  Accede request
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Expense splitter breakdown metrics */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Dynamic Fuel Share Calculator</h4>
                
                <div className="bg-[#0A0A0B]/80 border border-zinc-805 p-4 rounded-xl space-y-4">
                  {/* Cost share widget */}
                  <div className="grid grid-cols-2 gap-3 border-b border-zinc-800/80 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Single Occupant Cost</span>
                      <p className="text-base font-bold text-zinc-400 font-mono">₹{selectedRide.totalEstimatedFuelCost}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-500 block">Dynamically Shared Split</span>
                      <p className="text-lg font-bold text-cyan-400 font-mono">₹{calculateFuelSplit(selectedRide).splitPrice}</p>
                    </div>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-cyan-500 shrink-0" />
                        Traditional Surge Fare Equiv.
                      </span>
                      <span className="line-through text-rose-400 font-mono">₹{calculateFuelSplit(selectedRide).uberPricingEquiv}</span>
                    </div>

                    <div className="flex justify-between items-center bg-cyan-950/30 border border-cyan-900/40 p-2.5 rounded-xl">
                      <span className="text-cyan-350 font-semibold flex items-center gap-1">
                        <Flame className="w-4 h-4 text-cyan-400 shrink-0" />
                        Net Savings
                      </span>
                      <span className="text-cyan-400 font-bold font-mono">
                        {calculateFuelSplit(selectedRide).discountPercentage}% Cheaper!
                      </span>
                    </div>
                  </div>

                  {/* Ecological impact breakdown */}
                  <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
                      CO₂ Environmental Credit
                    </span>
                    <span className="font-bold text-emerald-300 font-mono">
                      -{Math.round(selectedRide.distanceMiles * 0.81 * (selectedRide.passengers.length || 1))} lbs Carbon
                    </span>
                  </div>
                </div>

                {/* Secure MFA Circle Assurance */}
                <div className="bg-cyan-950/10 border border-cyan-900/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-cyan-200">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Secured P2P Room Protocol</span> Every peer in this commute holds verified academic / corporate emails. Cash handling is avoided—fuel expenses are distributed via app token integrations.
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Room Coordination Room */}
            <div className="px-6 py-5 bg-[#0F0F11]/90 border-t border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-405 font-mono flex items-center gap-1.5 mb-4">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Peer Circle Coordination Channel
              </h4>

              <div className="space-y-3 max-h-[160px] overflow-y-auto mb-4 bg-[#0A0A0B] p-4 rounded-xl border border-zinc-800 font-sans">
                {messages
                  .filter(m => m.rideId === selectedRide.id)
                  .map((m, idx) => {
                    const isSystem = m.senderId === 'system';
                    const isMe = m.senderId === currentUser.id;

                    if (isSystem) {
                      return (
                        <div key={idx} className="bg-[#161618] border border-zinc-800 p-2 rounded-lg text-center text-[10px] font-mono text-cyan-400">
                          {m.text}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5 font-mono">
                          <span>{m.senderName}</span>
                          <span>•</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl text-xs max-w-[75%] ${isMe ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-[#161618] text-zinc-200 border border-zinc-800 rounded-tl-none'}`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Send Chat input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message driver or coordinate pickup locations..."
                  value={currentChatText}
                  onChange={(e) => setCurrentChatText(e.target.value)}
                  className="flex-1 bg-[#0A0A0B] border border-zinc-805 focus:border-cyan-500 focus:outline-none text-zinc-300 text-xs py-2 px-3 rounded-xl"
                />
                <button
                  type="submit"
                  className="bg-cyan-550 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-[#161618] border border-zinc-800 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-[#0A0A0B] border border-zinc-800 rounded-full text-zinc-600">
              <Car className="w-12 h-12 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Select a Scheduled Commute</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                Choose an active commute from the list to view geographical path overlays, overlapping segments, fuel split options, and coordination logs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Post Commute Modal */}
      {showCreateRideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#161618] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5 border-b border-zinc-800 pb-3">
              <Sparkles className="text-cyan-400 w-5 h-5 animate-pulse" />
              Schedule Driver Commute Segment
            </h3>

            <form onSubmit={handleCreateRide} className="mt-4 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-zinc-350 mb-1">Departure Corridor Origin</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-zinc-800 p-2.5 rounded-xl text-zinc-300 text-xs focus:outline-none"
                  >
                    <option value="IIIT Hyderabad">IIIT Hyderabad</option>
                    <option value="Shamshabad RGI Airport">Shamshabad RGI Airport (HYD)</option>
                    <option value="Hitec City Metro Station">Hitec City Metro Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-350 mb-1">Corridor Endpoint Destination</label>
                  <select
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-zinc-805 p-2.5 rounded-xl text-zinc-300 text-xs focus:outline-none"
                  >
                    <option value="Secunderabad Station">Secunderabad Junction Metro</option>
                    <option value="Google Hyderabad (Kondapur)">Google Hyderabad (Kondapur)</option>
                    <option value="Shamshabad RGI Airport">Shamshabad RGI Airport</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1">Commute Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 p-2 rounded-xl text-zinc-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1">Departure Hour</label>
                    <input
                      type="text"
                      placeholder="09:00 AM"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 p-2 rounded-xl text-zinc-200 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1">Vehicle Mileage (km/L)</label>
                    <input
                      type="number"
                      required
                      value={mpgInput}
                      onChange={(e) => setMpgInput(parseInt(e.target.value) || 30)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 p-2 rounded-xl text-zinc-200 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-350 mb-1">Empty Passenger Seats</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newSeats}
                      onChange={(e) => setNewSeats(parseInt(e.target.value) || 4)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 p-2 rounded-xl text-zinc-200 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {!currentUser.isVerified && (
                <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[10px] text-rose-300 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Warning: You are unverified. Please verify institutional alignments inside "Security Center" to post on the feed.
                </div>
              )}

              <div className="flex gap-2 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowCreateRideModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-xl cursor-pointer"
                >
                  Post Commute
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
