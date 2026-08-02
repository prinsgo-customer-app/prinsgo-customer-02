import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import io from 'socket.io-client';

const BACKEND_URL = 'http://192.168.1.100:5000'; // Apna live backend URL dalein
let socket;

export default function App() {
  const [screen, setScreen] = useState('home'); // home, options, searching, tracking, rating, bookings, wallet, profile
  const [selectedService, setSelectedService] = useState('Car');
  const [pickup, setPickup] = useState('Vijay Nagar, Indore');
  const [drop, setDrop] = useState('Rajwada, Indore');
  const [walletBalance, setWalletBalance] = useState(1250);
  const [rideId, setRideId] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [driverLocation, setDriverLocation] = useState({ latitude: 22.7196, longitude: 75.8577 });
  const [rideHistory, setRideHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rating, setRating] = useState(5);

  const userId = 'PRINS_USER_01';

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log('Connected to live backend:', socket.id);
    });

    socket.on('rideAccepted', (data) => {
      if (data.rideId === rideId || data.driver) {
        setDriverDetails(data.driver);
        setScreen('tracking');
      }
    });

    socket.on('driverLocationUpdate', (location) => {
      setDriverLocation(location);
    });

    socket.on('rideCancelledByAdmin', () => {
      Alert.alert('Cancelled', 'Ride was cancelled by admin or driver.');
      setScreen('home');
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [rideId]);

  // Fetch Live Ride History from MongoDB
  const fetchRideHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/rides/history/${userId}`);
      const data = await response.json();
      if (data.success) {
        setRideHistory(data.rides);
      }
    } catch (error) {
      console.log('Failed to fetch history from DB:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBookRide = async (categoryFare, categoryName) => {
    setScreen('searching');
    try {
      const response = await fetch(`${BACKEND_URL}/api/rides/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: `${selectedService} - ${categoryName}`,
          pickupLocation: pickup,
          dropLocation: drop,
          fare: categoryFare,
          userId: userId
        })
      });

      const data = await response.json();
      if (data.success) {
        setRideId(data.rideId);
      } else {
        Alert.alert('Booking Error', data.message || 'Could not create ride');
        setScreen('home');
      }
    } catch (error) {
      Alert.alert('Network Connection Error', `Unable to reach server at ${BACKEND_URL}.\nDetails: ${error.message}`);
      setScreen('home');
    }
  };

  const handleCancelRide = () => {
    if (socket && rideId) {
      socket.emit('cancelRide', { rideId });
    }
    Alert.alert('Cancelled', 'Ride request cancelled.');
    setScreen('home');
  };

  const handleCompleteTrip = () => {
    setScreen('rating');
  };

  const submitRatingAndFinish = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/rides/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, rating })
      });
    } catch (err) {
      console.log('Rating sync error:', err);
    }
    Alert.alert('Thank You!', 'Feedback submitted and payment recorded successfully.');
    setScreen('home');
    fetchRideHistory();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🚗 PrinsGo</Text>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>Live Sync</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.walletHeaderBtn} onPress={() => setScreen('wallet')}>
          <Text style={styles.walletHeaderAmt}>₹{walletBalance}.00</Text>
          <Text style={styles.walletHeaderAction}>+ Wallet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. HOME SCREEN */}
        {screen === 'home' && (
          <View>
            <View style={styles.locationCard}>
              <Text style={styles.cardTitle}>Where are you going today?</Text>
              <View style={styles.inputRow}>
                <Text style={styles.greenPin}>🟢</Text>
                <TextInput style={styles.textInput} value={pickup} onChangeText={setPickup} placeholder="Pickup Location" />
              </View>
              <View style={styles.separator} />
              <View style={styles.inputRow}>
                <Text style={styles.redPin}>🔴</Text>
                <TextInput style={styles.textInput} value={drop} onChangeText={setDrop} placeholder="Drop Destination" />
              </View>
            </View>

            <Text style={styles.sectionHeader}>Select Service Category</Text>
            <View style={styles.servicesGrid}>
              {[
                { id: 'Bike', icon: '🏍️', time: '1 min', price: '₹60' },
                { id: 'Auto', icon: '🛺', time: '2 mins', price: '₹90' },
                { id: 'Car', icon: '🚗', time: '4 mins', price: '₹180' },
                { id: 'Parcel', icon: '📦', time: 'Instant', price: '₹110' }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.serviceBox, selectedService === item.id && styles.serviceBoxSelected]}
                  onPress={() => {
                    setSelectedService(item.id);
                    setScreen('options');
                  }}
                >
                  <Text style={styles.timeTag}>{item.time}</Text>
                  <Text style={styles.serviceIcon}>{item.icon}</Text>
                  <Text style={styles.serviceName}>{item.id}</Text>
                  <Text style={styles.servicePrice}>{item.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 2. RIDE OPTIONS SCREEN */}
        {screen === 'options' && (
          <View>
            <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Change Location / Services</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>Choose {selectedService} Tier</Text>

            {[
              { title: `${selectedService} Standard`, eta: '1 min away', fare: selectedService === 'Bike' ? 60 : selectedService === 'Auto' ? 90 : 180, desc: 'Everyday affordable option' },
              { title: `${selectedService} Comfort`, eta: '3 mins away', fare: selectedService === 'Bike' ? 90 : selectedService === 'Auto' ? 130 : 250, desc: 'Top condition vehicles with verified drivers' }
            ].map((opt, i) => (
              <TouchableOpacity key={i} style={styles.fareCard} onPress={() => handleBookRide(opt.fare, opt.title)}>
                <View>
                  <Text style={styles.fareTitle}>{opt.title}</Text>
                  <Text style={styles.fareDesc}>{opt.desc}</Text>
                  <Text style={styles.fareEta}>⏱️ {opt.eta}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.fareAmount}>₹{opt.fare}</Text>
                  <Text style={styles.bookNowText}>Book Now →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. SEARCHING SCREEN */}
        {screen === 'searching' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0051ff" style={{marginVertical: 20}} />
            <Text style={styles.searchingTitle}>Broadcasting to Driver App & Admin Panel...</Text>
            <Text style={styles.searchingSub}>Waiting for live driver confirmation...</Text>
            <TouchableOpacity style={styles.cancelBtnLarge} onPress={handleCancelRide}>
              <Text style={styles.cancelBtnText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. LIVE TRACKING SCREEN */}
        {screen === 'tracking' && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapSimulationBox}>
              <Text style={styles.mapSimulationTitle}>📍 Live GPS Tracking Active</Text>
              <Text style={styles.mapSimulationSub}>Driver coordinates: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}</Text>
            </View>

            <View style={styles.driverDetailCard}>
              <View>
                <Text style={styles.driverName}>{driverDetails?.name || 'Ramesh Kumar'} ({driverDetails?.rating || '4.9'} ⭐)</Text>
                <Text style={styles.driverCar}>{driverDetails?.vehicle || 'Swift Dzire • MP09 AB 1234'}</Text>
                <Text style={styles.otpText}>Trip OTP: <Text style={{fontWeight: 'bold', color: '#0051ff'}}>9821</Text></Text>
              </View>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleCancelRide}>
                <Text style={styles.dangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.completeTripBtn} onPress={handleCompleteTrip}>
              <Text style={styles.completeTripText}>Complete Trip Simulation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. RATING & REVIEW SCREEN */}
        {screen === 'rating' && (
          <View style={styles.centerContainer}>
            <Text style={styles.searchingTitle}>Rate Your Driver</Text>
            <Text style={styles.searchingSub}>How was your experience with {driverDetails?.name || 'the driver'}?</Text>
            <View style={{flexDirection: 'row', marginVertical: 15}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{fontSize: 32, marginHorizontal: 5}}>{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.completeTripBtn} onPress={submitRatingAndFinish}>
              <Text style={styles.completeTripText}>Submit & Pay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. BOOKINGS HISTORY (MONGODB) */}
        {screen === 'bookings' && (
          <View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={styles.sectionHeader}>MongoDB Ride History</Text>
              <TouchableOpacity onPress={fetchRideHistory}>
                <Text style={{color: '#0051ff', fontWeight: 'bold'}}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
            {loadingHistory ? (
              <ActivityIndicator size="small" color="#0051ff" style={{marginTop: 20}} />
            ) : rideHistory.length === 0 ? (
              <View style={styles.walletBoxLarge}>
                <Text style={{color: '#666', textAlign: 'center'}}>No past trips found in MongoDB database.</Text>
                <TouchableOpacity style={[styles.addMoneyButton, {marginTop: 10}]} onPress={fetchRideHistory}>
                  <Text style={styles.addMoneyButtonText}>Load History</Text>
                </TouchableOpacity>
              </View>
            ) : (
              rideHistory.map((item, index) => (
                <View key={index} style={styles.historyCard}>
                  <View>
                    <Text style={styles.historyTitle}>{item.serviceType}</Text>
                    <Text style={styles.historySub}>{item.status} • {new Date(item.createdAt).toDateString()}</Text>
                  </View>
                  <Text style={styles.historyAmount}>₹{item.fare}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* 7. WALLET SCREEN */}
        {screen === 'wallet' && (
          <View>
            <Text style={styles.sectionHeader}>Wallet & Payments</Text>
            <View style={styles.walletBoxLarge}>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletBigValue}>₹{walletBalance}.00</Text>
              <TouchableOpacity style={styles.addMoneyButton} onPress={() => { setWalletBalance(walletBalance + 500); Alert.alert('Success', '₹500 added to wallet!'); }}>
                <Text style={styles.addMoneyButtonText}>+ Add ₹500 via UPI</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 8. PROFILE SCREEN */}
        {screen === 'profile' && (
          <View>
            <Text style={styles.sectionHeader}>Account Profile</Text>
            <View style={styles.profileBox}>
              <Text style={styles.profileName}>Pahul Soni (Prins)</Text>
              <Text style={styles.profilePhone}>+91 8629995010 • Admin Access Enabled</Text>
            </View>
            {['Saved Locations', 'Payment Methods', 'Emergency SOS', 'Help & Support', 'Logout'].map((item, i) => (
              <TouchableOpacity key={i} style={styles.menuRow} onPress={() => Alert.alert(item, 'Module active.')}>
                <Text style={styles.menuText}>{item}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => setScreen('home')}>
          <Text style={[styles.navTabText, screen === 'home' && styles.navTabActiveText]}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => { setScreen('bookings'); fetchRideHistory(); }}>
          <Text style={[styles.navTabText, screen === 'bookings' && styles.navTabActiveText]}>📦 Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => setScreen('wallet')}>
          <Text style={[styles.navTabText, screen === 'wallet' && styles.navTabActiveText]}>💳 Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => setScreen('profile')}>
          <Text style={[styles.navTabText, screen === 'profile' && styles.navTabActiveText]}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center', elevation: 4 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0051ff', marginRight: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f4ea', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34a853', marginRight: 4 },
  badgeText: { fontSize: 9, color: '#137333', fontWeight: 'bold' },
  walletHeaderBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  walletHeaderAmt: { color: '#0051ff', fontWeight: 'bold', fontSize: 13 },
  walletHeaderAction: { color: '#28a745', fontSize: 9, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  locationCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, paddingHorizontal: 10 },
  greenPin: { marginRight: 8, fontSize: 12 },
  redPin: { marginRight: 8, fontSize: 12 },
  textInput: { flex: 1, height: 44, fontSize: 14, color: '#333' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  servicesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  serviceBox: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, marginHorizontal: 4, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  serviceBoxSelected: { borderColor: '#0051ff', backgroundColor: '#f0f4ff', borderWidth: 2 },
  timeTag: { fontSize: 9, color: '#0051ff', fontWeight: 'bold', backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  serviceIcon: { fontSize: 26, marginBottom: 4 },
  serviceName: { fontWeight: 'bold', color: '#333', fontSize: 12 },
  servicePrice: { fontSize: 11, color: '#666', marginTop: 2 },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: '#0051ff', fontWeight: 'bold', fontSize: 14 },
  fareCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, alignItems: 'center', elevation: 2 },
  fareTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  fareDesc: { fontSize: 12, color: '#666', marginVertical: 2 },
  fareEta: { fontSize: 11, color: '#0051ff', fontWeight: '600' },
  fareAmount: { fontSize: 18, fontWeight: 'bold', color: '#0051ff' },
  bookNowText: { fontSize: 12, color: '#28a745', fontWeight: 'bold', marginTop: 4 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20, backgroundColor: '#fff', borderRadius: 16, elevation: 3 },
  searchingTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  searchingSub: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20 },
  cancelBtnLarge: { backgroundColor: '#fee2e2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  cancelBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
  trackingContainer: { alignItems: 'center' },
  mapSimulationBox: { width: '100%', height: 180, backgroundColor: '#dbeafe', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mapSimulationTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 },
  mapSimulationSub: { fontSize: 12, color: '#1d4ed8' },
  driverDetailCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', elevation: 3, marginBottom: 12 },
  driverName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  driverCar: { fontSize: 12, color: '#666', marginVertical: 2 },
  otpText: { fontSize: 12, color: '#444', marginTop: 4 },
  dangerBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dangerText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },
  completeTripBtn: { backgroundColor: '#28a745', width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  completeTripText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, alignItems: 'center', elevation: 2 },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  historySub: { fontSize: 12, color: '#666', marginTop: 4 },
  historyAmount: { fontSize: 16, fontWeight: 'bold', color: '#0051ff' },
  walletBoxLarge: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 3 },
  walletLabel: { fontSize: 14, color: '#666', marginBottom: 6 },
  walletBigValue: { fontSize: 34, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20 },
  addMoneyButton: { backgroundColor: '#2e7d32', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  addMoneyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  profileBox: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 16, elevation: 2 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profilePhone: { fontSize: 13, color: '#666', marginTop: 2 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center', elevation: 1 },
  menuText: { fontSize: 14, fontWeight: '600', color: '#333' },
  menuArrow: { fontSize: 18, color: '#999' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', height: 60, borderTopWidth: 1, borderTopColor: '#e5e7eb', justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navTab: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navTabText: { fontSize: 12, color: '#666', fontWeight: '600' },
  navTabActiveText: { color: '#0051ff', fontWeight: 'bold' }
});
