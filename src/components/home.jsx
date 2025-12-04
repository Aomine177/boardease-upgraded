import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';

const Home = () => {
  const navigate = useNavigate();
  // Main carousel state (show 3 items per slide, advance by 3)
  const CAR_STEP = 3;
  const [carouselStart, setCarouselStart] = useState(0);

  // Room images for the carousel
  const carouselImages = [
    {
      id: 1,
      title: "Cozy Blue Room",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80",
      description: "A vibrant room with blue walls and modern furniture"
    },
    {
      id: 2,
      title: "Modern Living Room",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
      description: "Spacious living room with ocean view"
    },
    {
      id: 3,
      title: "Luxury Bedroom",
      image: "https://plus.unsplash.com/premium_photo-1661879252375-7c1db1932572?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bHV4dXJ5JTIwYmVkcm9vbXxlbnwwfHwwfHx8MA%3D%3D",
      description: "Elegant bedroom with premium furnishings"
    },
    {
      id: 4,
      title: "Scandinavian Suite",
      image: "https://media.istockphoto.com/id/2093684615/photo/digitally-created-spacious-modern-living-room.jpg?s=612x612&w=0&k=20&c=nMASk6C34x5Y-hr6d0vIUuUBvBkwA98XiUJm1cOheK4=",
      description: "Minimalist suite with natural light"
    },
    {
      id: 5,
      title: "Urban Loft",
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
      description: "Open-plan loft in the city center"
    },
    {
      id: 6,
      title: "Coastal Retreat",
      image: "https://media.istockphoto.com/id/2238998512/photo/nigh-costal-view-with-cabanas-and-white-sand-beach-doha-qatar.jpg?s=612x612&w=0&k=20&c=ULN7tLVmgAG6xoLwnVWyWArmkfsamTigAgjARp_RPAk=",
      description: "Relaxing room with sea views"
    }
  ];

  const getVisibleCarouselItems = () => {
    const out = [];
    for (let i = 0; i < CAR_STEP; i++) {
      const idx = (carouselStart + i) % carouselImages.length;
      out.push(carouselImages[idx]);
    }
    return out;
  };

  // Autoplay removed: user requested manual control (click next/prev selects one-by-one)

  // Highlight visible items briefly when they come into view
  const [highlightedIds, setHighlightedIds] = useState([]);
  useEffect(() => {
    // Highlight only the selected single item (the one at carouselStart)
    const idx = carouselStart % carouselImages.length;
    const id = carouselImages[idx]?.id;
    if (id !== undefined) {
      setHighlightedIds([id]);
      const t = setTimeout(() => setHighlightedIds([]), 700);
      return () => clearTimeout(t);
    }
    setHighlightedIds([]);
    return undefined;
  }, [carouselStart]);


  // Service features data
  const services = [
    {
      icon: "🕒",
      title: "Open 24/7",
      description: "24 hours access"
    },
    {
      icon: "🏆",
      title: "24 HOURS RETURN",
      description: "100% money-back guarantee"
    },
    {
      icon: "💳",
      title: "SECURE PAYMENT",
      description: "Your money is safe"
    },
    {
      icon: "🎧",
      title: "SUPPORT 24/7",
      description: "Live contact/message"
    }
  ];


  // Available rooms
  const availableRooms = [
    {
      id: 1,
      title: "Room 1",
      image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Um9vbXN8ZW58MHx8MHx8fDA%3D",
      price: "$120/night"
    },
    {
      id: 2,
      title: "Room 2",
      image: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fFJvb21zfGVufDB8fDB8fHww",
      price: "$150/night"
    },
    {
      id: 3,
      title: "Room 3",
      image: "https://media.istockphoto.com/id/1001130682/photo/modern-bright-skandinavian-interior-design-living-room.webp?a=1&s=612x612&w=0&k=20&c=JUJmmEJXkflO-Q3fP4hS0xKBj6qZHZx0Gtfu18LhhJA=",
      price: "$180/night"
    },
    {
      id: 4,
      title: "Room 4",
      image: "https://plus.unsplash.com/premium_photo-1661964000526-1bf2d91bd451?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDEyfHx8ZW58MHx8fHx8",
      price: "$200/night"
    }
  ];

  // Carousel state for Available Rooms (show by groups)
  const STEP = 3; // move by 3 items each advance
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(9); // 9 = 3x3 on desktop

  // Responsive visibleCount: mobile 3, tablet 6, desktop 9
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(3);
      else if (w < 1024) setVisibleCount(6);
      else setVisibleCount(9);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Auto-advance by STEP every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((s) => (s + STEP) % availableRooms.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [availableRooms.length]);

  const getVisibleRooms = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const idx = (startIndex + i) % availableRooms.length;
      result.push(availableRooms[idx]);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header */}
      <Header />
      {/* Main Carousel/Gallery Section */}
      <section className="bg-[#061A25] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => setCarouselStart((s) => (s - 1 + carouselImages.length) % carouselImages.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCarouselStart((s) => (s + 1) % carouselImages.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Container (3 items per slide) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {getVisibleCarouselItems().map((room) => {
                const isHighlighted = highlightedIds.includes(room.id);
                return (
                  <div
                    key={room.id}
                    className={`relative rounded-lg overflow-hidden shadow-xl transition-transform duration-500 transform ${isHighlighted ? 'scale-105 z-10' : 'hover:scale-105'}`}
                  >
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-48 sm:h-64 lg:h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-semibold text-md mb-1">{room.title}</h3>
                      <p className="text-sm text-gray-200">{room.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* See More Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate('/rooms')}
                className="bg-[#061A25] hover:bg-[#0a2535] text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/20 inline-flex items-center"
              >
                <span>See more</span>
                <svg className="ml-3 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Highlights */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="service-grid grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, index) => (
              <div key={index} className="text-center p-4 md:p-6 relative">
                <div className="text-3xl md:text-4xl mb-3">{service.icon}</div>
                <h3 className="font-bold text-sm md:text-base mb-2 text-black">{service.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Rooms
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Discover our carefully selected rooms designed for comfort and convenience. 
              Each space offers modern amenities and a welcoming atmosphere.
            </p>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={room.image}
                    alt="Featured room"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* About Us Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              About Board Ease
            </h2>
            <div className="w-24 h-1 bg-[#061A25] mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Your trusted partner in finding the perfect boarding house with seamless payment solutions
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left Side - Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cm9vbXxlbnwwfHwwfHx8MA%3D%3D"
                  alt="About Board Ease"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-[#061A25] text-white p-6 rounded-xl shadow-xl max-w-xs">
                <p className="text-3xl font-bold mb-2">100+</p>
                <p className="text-sm">Happy Tenants</p>
              </div>
            </div>

            {/* Right Side - Content */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Simplifying Boarding House Management
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Board Ease was created to bridge the gap between landlords and tenants, providing a modern platform 
                that makes finding, booking, and managing boarding house stays easier than ever before.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                With our integrated payment system, you can focus on what matters most - creating a comfortable 
                home away from home. We handle the complexity of payments, bookings, and communication so you don't have to.
              </p>
              
              {/* Key Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[#061A25] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Secure Online Payments</h4>
                    <p className="text-sm text-gray-600">All transactions are encrypted and processed through trusted payment gateways</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[#061A25] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">24/7 Support</h4>
                    <p className="text-sm text-gray-600">Our dedicated team is always ready to assist you with any questions or concerns</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[#061A25] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Easy Management</h4>
                    <p className="text-sm text-gray-600">Intuitive dashboard for landlords and tenants to manage everything in one place</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#061A25] mb-2">50+</p>
              <p className="text-gray-600 text-sm">Properties Listed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#061A25] mb-2">100+</p>
              <p className="text-gray-600 text-sm">Happy Tenants</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#061A25] mb-2">24/7</p>
              <p className="text-gray-600 text-sm">Support Available</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#061A25] mb-2">99%</p>
              <p className="text-gray-600 text-sm">Satisfaction Rate</p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To revolutionize the boarding house industry by providing a seamless, secure, and user-friendly 
                platform that connects landlords with tenants while simplifying payment processes and property management.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become the leading boarding house management platform in the Philippines, known for innovation, 
                reliability, and exceptional service that makes finding and managing accommodations effortless for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;

