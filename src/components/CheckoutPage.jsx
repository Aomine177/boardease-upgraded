// CheckoutPage.jsx - Booking Checkout with User Info
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/authcontext';
import Header from '../components/Header';
import Footer from '../components/footer';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // booking_request id
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // User info state
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zipCode: ''
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user && id) {
      fetchBookingData();
    }
  }, [user, id]);

  const fetchBookingData = async () => {
    try {
      // Fetch booking request
      const { data: bookingData, error: bookingError } = await supabase
        .from('booking_requests')
        .select('*, rooms(*)')
        .eq('id', id)
        .eq('requestor', user.id)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);
      setRoom(bookingData.rooms);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Pre-fill user info
      setUserInfo({
        fullName: profileData.full_name || '',
        email: user.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        province: profileData.province || '',
        zipCode: profileData.zip_code || ''
      });

    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Failed to load booking details');
      navigate('/profile#my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    // Validation
    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }

    setProcessing(true);

    try {
      // Update booking with user info
      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({
          contact_name: userInfo.fullName,
          contact_email: userInfo.email,
          contact_phone: userInfo.phone,
          contact_address: `${userInfo.address}, ${userInfo.city}, ${userInfo.province} ${userInfo.zipCode}`.trim(),
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Navigate to payment page
      console.log('✅ Booking updated, redirecting to payment...');
      navigate(`/payment-stripe/${id}`);

    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to proceed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading checkout...</div>
      </div>
    );
  }

  if (!booking || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Booking not found</div>
      </div>
    );
  }

  const monthlyAmount = room.price_monthly || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Header Bar */}
      <header className="bg-[#061A25] text-white py-4 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold">Checkout</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-grow">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Complete Your Booking</h2>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          
          {/* Contact Information */}
          <section className="p-4 sm:p-6 border-b-4 border-dashed border-blue-300">
            <div className="flex items-center space-x-2 text-blue-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo({...userInfo, fullName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="juan@example.com"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="123 Main Street"
                  value={userInfo.address}
                  onChange={(e) => setUserInfo({...userInfo, address: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Manila"
                    value={userInfo.city}
                    onChange={(e) => setUserInfo({...userInfo, city: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <input
                    type="text"
                    placeholder="Metro Manila"
                    value={userInfo.province}
                    onChange={(e) => setUserInfo({...userInfo, province: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    placeholder="1000"
                    value={userInfo.zipCode}
                    onChange={(e) => setUserInfo({...userInfo, zipCode: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Booking Details */}
          <section className="p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Room Number</span>
                <span className="font-semibold text-gray-900">{room.room_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Room Type</span>
                <span className="font-medium text-gray-900">{room.room_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rental Term</span>
                <span className="font-medium text-gray-900">{room.rental_term}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Capacity</span>
                <span className="font-medium text-gray-900">{room.capacity} person(s)</span>
              </div>
              {room.amenities && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amenities</span>
                  <span className="font-medium text-gray-900 text-right">{room.amenities}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows="3"
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </section>

          {/* Payment Summary */}
          <section className="p-4 sm:p-6 bg-gray-100 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-medium">₱{monthlyAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-300 pt-4">
              <span className="text-lg font-bold text-gray-900">Total Payment:</span>
              <span className="text-xl sm:text-2xl font-bold text-[#061A25]">
                ₱{monthlyAmount.toLocaleString()}
              </span>
            </div>

            {/* Proceed Button */}
            <div className="pt-6">
              <button 
                onClick={handleProceedToPayment}
                disabled={processing}
                className={`w-full bg-[#061A25] text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors duration-200 shadow-lg flex items-center justify-center ${
                  processing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[#0a2433]'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    PROCESSING...
                  </>
                ) : (
                  'PROCEED TO PAYMENT'
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-3">
                You will enter card details on the next page
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;