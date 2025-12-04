import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/authcontext';

const RoomDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get room ID from URL
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    checkIn: '',
    checkOut: ''
  });

  // Static features for all rooms
  const features = [
    { id: 1, name: 'Air conditioning', icon: '❄️' },
    { id: 2, name: 'City View', icon: '🏙️' },
    { id: 3, name: 'Clothing Storage', icon: '👔' },
    { id: 4, name: 'High Wifi Speed', icon: '📶' }
  ];

  // Fetch room details
  useEffect(() => {
    fetchRoomDetails();
    
    // Pre-fill user info if logged in
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [id, user]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        alert('Room not found');
        navigate('/room-selection');
        return;
      }

      setRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      alert('Error loading room details');
      navigate('/room-selection');
    } finally {
      setLoading(false);
    }
  };

  const getRoomImages = () => {
    if (!room?.image_urls) {
      return [{
        id: 1,
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
        alt: 'Room view'
      }];
    }

    try {
      const urls = JSON.parse(room.image_urls);
      return urls.map((url, index) => ({
        id: index + 1,
        url: url,
        alt: `Room ${room.room_number} view ${index + 1}`
      }));
    } catch {
      return [{
        id: 1,
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
        alt: 'Room view'
      }];
    }
  };

  const roomImages = getRoomImages();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookNow = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to book a room');
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);

      // Create booking request
      const { data, error } = await supabase
        .from('booking_requests')
        .insert([{
          room_id: room.id,
          requestor: user.id,
          status: 'Pending',
          message: `Check-in: ${formData.checkIn}, Check-out: ${formData.checkOut}. Contact: ${formData.phoneNumber}`
        }])
        .select();

      if (error) throw error;

      alert('Booking request submitted successfully! Please wait for admin approval.');
      navigate('/rooms');
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Error submitting booking: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading room details...</div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <button 
          onClick={() => navigate('/rooms')}
          className="bg-[#061A25] hover:bg-[#0a2535] text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/20 mb-5 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rooms
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Area - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Info Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                     Room {room.room_number}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                      {room.capacity}
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      {room.rental_term}
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                      {room.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#061A25]">
                    ₱{room.price_monthly.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2">
                {/* Main Large Image */}
                <div className="md:col-span-3">
                  <img
                    src={roomImages[selectedImageIndex].url}
                    alt={roomImages[selectedImageIndex].alt}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
                {/* Thumbnail Grid */}
                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                  {roomImages.slice(0, 4).map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-[#061A25] ring-2 ring-[#061A25]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-24 sm:h-32 lg:h-40 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* About Room Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Room</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {room.description || 'No description available for this room.'}
              </p>
            </div>

            {/* Room Features Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Room Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-4xl mb-2">{feature.icon}</div>
                    <p className="text-sm font-medium text-gray-700">{feature.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Form - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#061A25] rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold text-white mb-6">Book This Room</h2>
              <form onSubmit={handleBookNow} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-white text-sm font-medium mb-2">
                    Full name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-white text-sm font-medium mb-2">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkIn" className="block text-white text-sm font-medium mb-2">
                    Check in *
                  </label>
                  <input
                    type="date"
                    id="checkIn"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkOut" className="block text-white text-sm font-medium mb-2">
                    Check out *
                  </label>
                  <input
                    type="date"
                    id="checkOut"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || room.status !== 'Available'}
                  className="w-full bg-white hover:bg-gray-100 text-[#061A25] font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {submitting ? 'Submitting...' : room.status !== 'Available' ? 'Room Not Available' : 'Book Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RoomDetail;