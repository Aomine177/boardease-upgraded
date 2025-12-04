import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';
import { supabase } from '../lib/supabaseClient';

const RoomSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [rentalTerm, setRentalTerm] = useState('');
  const [totalPax, setTotalPax] = useState('');
  const [rentalRate, setRentalRate] = useState('');

  // Fetch rooms from database
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'Available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
      setFilteredRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [rentalTerm, totalPax, rentalRate, rooms]);

  const applyFilters = () => {
    let filtered = [...rooms];

    // Filter by rental term
    if (rentalTerm) {
      filtered = filtered.filter(room => room.rental_term === rentalTerm);
    }

    // Filter by capacity (totalPax)
    if (totalPax) {
      const capacityMap = {
        'One Person': 'Single',
        'Two People': 'Double',
        'Three People': 'Family',
        'Four+ People': 'Family'
      };
      const capacity = capacityMap[totalPax];
      if (capacity) {
        filtered = filtered.filter(room => room.capacity === capacity);
      }
    }

    // Filter by rental rate
    if (rentalRate) {
      const [min, max] = rentalRate.split('-').map(v => parseInt(v.replace('+', '')));
      filtered = filtered.filter(room => {
        const price = room.price_monthly;
        if (rentalRate.includes('+')) {
          return price >= min;
        }
        return price >= min && price <= max;
      });
    }

    setFilteredRooms(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setRentalTerm('');
    setTotalPax('');
    setRentalRate('');
  };

  // Pagination settings
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / ITEMS_PER_PAGE));
  const pagedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleInterested = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const nextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const isActive = (path) => location.pathname === path;

  // Get first image URL from JSON array
  const getRoomImage = (imageUrls) => {
    if (!imageUrls) return 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format&fit=crop&q=60';
    try {
      const urls = JSON.parse(imageUrls);
      return urls[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format&fit=crop&q=60';
    } catch {
      return 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format&fit=crop&q=60';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-4 top-4 z-50 bg-[#061A25] text-white p-3 rounded-lg shadow-lg hover:bg-[#0a2535] transition-all duration-300 lg:block hidden"
          aria-label="Show sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-white border-r border-gray-200 fixed lg:static inset-y-0 top-0 lg:top-auto z-40 transform transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-0 lg:w-0' : 'w-64 lg:w-72'
          } ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className={`h-full overflow-y-auto p-4 sm:p-6 transition-opacity duration-300 ${
            sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setSidebarCollapsed(!sidebarCollapsed);
                  if (sidebarCollapsed) setSidebarOpen(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:block hidden"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between border rounded-lg px-4 py-3 transition-all duration-200 ${
                  isActive('/notifications')
                    ? 'border-[#061A25] bg-[#061A25]/5 shadow-md'
                    : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <span className={`text-sm font-medium ${
                  isActive('/notifications') ? 'text-[#061A25] font-semibold' : 'text-gray-900'
                }`}>
                  Notifications
                </span>
                <div className="relative">
                  <svg className={`w-5 h-5 transition-colors ${
                    isActive('/notifications') ? 'text-[#061A25]' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <div className="text-sm text-gray-600">Results</div>
                <div className="text-2xl font-bold text-gray-900">{filteredRooms.length}</div>
                <div className="text-xs text-gray-500">rooms available</div>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <div className="flex justify-center">
                  <div className="bg-[#061A25] text-white rounded-full px-4 py-2 text-sm font-semibold">Rental Term</div>
                </div>
                <div className="mt-3 relative">
                  <select
                    value={rentalTerm}
                    onChange={(e) => setRentalTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#061A25] focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Terms</option>
                    <option value="One Month">One Month</option>
                    <option value="Two Months">Two Months</option>
                    <option value="Three Months">Three Months</option>
                    <option value="One Year">One Year</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-center">
                  <div className="bg-[#061A25] text-white rounded-full px-4 py-2 text-sm font-semibold">Capacity</div>
                </div>
                <div className="mt-3 relative">
                  <select
                    value={totalPax}
                    onChange={(e) => setTotalPax(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#061A25] focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Capacities</option>
                    <option value="Single Person">One Person</option>
                    <option value="Two People">Two People</option>
                    <option value="Three People">Three People</option>
                    <option value="Four+ People">Four+ People</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-center">
                  <div className="bg-[#061A25] text-white rounded-full px-4 py-2 text-sm font-semibold">Price Range</div>
                </div>
                <div className="mt-3 relative">
                  <select
                    value={rentalRate}
                    onChange={(e) => setRentalRate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#061A25] focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Prices</option>
                    <option value="0-5000">₱0 - ₱5,000</option>
                    <option value="5000-10000">₱5,000 - ₱10,000</option>
                    <option value="10000-15000">₱10,000 - ₱15,000</option>
                    <option value="15000-20000">₱15,000 - ₱20,000</option>
                    <option value="20000+">₱20,000+</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { applyFilters(); setSidebarOpen(false); }}
                className="w-full bg-[#061A25] hover:bg-[#0a2535] text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Filters
              </button>
              <button
                onClick={() => { clearFilters(); setSidebarOpen(false); }}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center gap-2 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 top-0"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className={`flex-1 overflow-y-auto bg-white transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <div className="lg:hidden p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-[#061A25] text-white p-2 rounded-lg hover:bg-[#0a2535] transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading rooms...</div>
              </div>
            ) : pagedRooms.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-center">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-lg">No rooms available matching your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[#061A25] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                  {pagedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={getRoomImage(room.image_urls)}
                          alt={`Room ${room.room_number}`}
                          className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&auto=format&fit=crop&q=60';
                          }}
                        />
                        <div className="absolute top-4 right-4 bg-[#061A25] text-white px-3 py-1 rounded-lg text-sm font-semibold">
                          ₱{room.price_monthly.toLocaleString()}/mo
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Room {room.room_number}</h3>
                        <p className="text-sm text-gray-600 mb-3">{room.capacity} • {room.rental_term}</p>
                        <button 
                          onClick={() => handleInterested(room.id)}
                          className="w-full bg-[#061A25] hover:bg-[#0a2535] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Prev</span>
                  </button>
                  
                  <div className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-900">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default RoomSelection;