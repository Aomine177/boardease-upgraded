import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/authcontext';

// Icon Definitions
const Icon = ({ path, className = "w-6 h-6", ...props }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const UserIcon = (props) => <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" {...props} />;
const BagIcon = (props) => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" {...props} />;
const CameraIcon = (props) => <Icon path="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z" {...props} />;
const CheckCircleIcon = (props) => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" {...props} />;

const ActionButton = ({ label, onClick, style = 'primary' }) => {
    const baseStyle = "px-3 py-1 text-xs font-bold rounded-lg transition-colors shadow-sm min-w-[70px]";
    const specificStyle = style === 'primary' 
        ? "bg-black text-white hover:bg-gray-800" 
        : "bg-white text-black border border-gray-300 hover:bg-gray-100";

    return <button onClick={onClick} className={`${baseStyle} ${specificStyle}`}>{label}</button>;
};

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
    });
    const [profileImage, setProfileImage] = useState(null);
    const [uploadMessage, setUploadMessage] = useState({ text: '', type: '' });
    const [selectedTab, setSelectedTab] = useState('Payment');
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [tenancies, setTenancies] = useState([]);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchBookings();
            fetchTenancies();
            fetchPayments();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                });
                setProfileImage(data.avatar_url || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('booking_requests')
                .select('*, rooms(room_number, price_monthly)')
                .eq('requestor', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchTenancies = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*, rooms(room_number, price_monthly)')
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTenancies(data || []);
        } catch (error) {
            console.error('Error fetching tenancies:', error);
        }
    };

    const fetchPayments = async () => {
        try {
            const { data: tenantsData } = await supabase
                .from('tenants')
                .select('id')
                .eq('profile_id', user.id);

            if (!tenantsData || tenantsData.length === 0) return;

            const tenantIds = tenantsData.map(t => t.id);
            
            const { data, error } = await supabase
                .from('payments')
                .select('*, rooms(room_number)')
                .in('tenant_id', tenantIds)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            setUploadMessage({ text: 'Error: File size must be less than 1 MB.', type: 'error' });
            return;
        }

        try {
            setUploadMessage({ text: 'Uploading...', type: 'success' });

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            if (profileImage) {
                const oldFileName = profileImage.split('/').pop();
                await supabase.storage.from('avatars').remove([`${user.id}/${oldFileName}`]);
            }

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                });

            if (updateError) throw updateError;

            setProfileImage(publicUrl);
            setUploadMessage({ text: 'Profile image updated successfully!', type: 'success' });
            setTimeout(() => setUploadMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadMessage({ text: 'Error uploading image', type: 'error' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setUploadMessage({ text: 'Profile saved successfully!', type: 'success' });
            setTimeout(() => setUploadMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setUploadMessage({ text: 'Error saving profile', type: 'error' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const tabs = ['Payment', 'Room Status', 'Ongoing Rent', 'Rent History', 'Payment History'];

    // ✅ FIXED: Check which bookings have been paid
    const getPaidBookingIds = () => {
        return payments
            .filter(p => p.payment_status === 'Paid')
            .map(p => {
                const booking = bookings.find(b => b.room_id === p.room_id && b.status === 'Approved');
                return booking?.id;
            })
            .filter(Boolean);
    };

    const paidBookingIds = getPaidBookingIds();

    // ✅ Handle Cancel Booking - Room stays available
    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            // Get booking info first
            const { data: booking } = await supabase
                .from('booking_requests')
                .select('room_id')
                .eq('id', bookingId)
                .single();

            // Update booking status to Cancelled
            const { error } = await supabase
                .from('booking_requests')
                .update({ 
                    status: 'Cancelled',
                    decided_at: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (error) throw error;

            // Room stays Available (don't change room status)
            // This way it appears in room selection

            alert('Booking cancelled successfully!');
            fetchBookings(); // Refresh the bookings list
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking: ' + error.message);
        }
    };

    // Organize booking data by tab
    const bookingData = {
        // ✅ FIXED: Filter out paid bookings
        'Payment': bookings
            .filter(b => b.status === 'Approved' && !paidBookingIds.includes(b.id))
            .map(b => ({
                id: b.id,
                name: `Room ${b.rooms?.room_number}`,
                status: 'AWAITING PAYMENT',
                price: b.rooms?.price_monthly
            })),
        'Room Status': bookings.map(b => ({
            id: b.id,
            name: `Room ${b.rooms?.room_number}`,
            status: b.status.toUpperCase(),
            message: b.message
        })),
        'Ongoing Rent': tenancies.filter(t => t.status === 'Active').map(t => ({
            id: t.id,
            name: `Room ${t.rooms?.room_number}`,
            status: 'ACTIVE',
            startDate: t.rent_start,
            endDate: t.rent_due
        })),
        'Rent History': tenancies.filter(t => t.status === 'Inactive').map(t => ({
            id: t.id,
            name: `Room ${t.rooms?.room_number}`,
            status: 'COMPLETED',
            startDate: t.rent_start,
            endDate: t.rent_due
        })),
        'Payment History': payments.map(p => ({
            id: p.id,
            name: `Room ${p.rooms?.room_number}`,
            status: p.payment_status.toUpperCase(),
            amount: p.amount,
            date: p.payment_date
        }))
    };

    const renderBookingItem = (item) => {
        let actionButtons;
        let statusColorClass;
        
        switch (selectedTab) {
            case 'Payment':
                actionButtons = (
                    <>
                        <ActionButton label="PAY NOW" onClick={() => navigate(`/checkout/${item.id}`)} style="primary" />
                        <ActionButton label="CANCEL" onClick={() => handleCancelBooking(item.id)} style="secondary" />
                    </>
                );
                statusColorClass = 'text-orange-600';
                break;
            case 'Room Status':
                actionButtons = (
                    <button className="text-black text-sm font-medium hover:text-gray-700 transition-colors p-2">
                        View Details
                    </button>
                );
                statusColorClass = item.status.includes('APPROVED') ? 'text-green-600' : 
                                  item.status.includes('DECLINED') ? 'text-red-600' : 'text-orange-600';
                break;
            case 'Ongoing Rent':
                actionButtons = (
                    <button className="text-black text-sm font-medium hover:text-gray-700 transition-colors p-2">
                        View Details
                    </button>
                );
                statusColorClass = 'text-green-600';
                break;
            case 'Rent History':
                actionButtons = null;
                statusColorClass = 'text-gray-600';
                break;
            case 'Payment History':
                actionButtons = (
                    <button className="text-black text-sm font-medium hover:text-gray-700 transition-colors p-2">
                        VIEW RECEIPT
                    </button>
                );
                statusColorClass = item.status.includes('PAID') ? 'text-green-600' : 'text-red-600';
                break;
            default:
                actionButtons = null;
                statusColorClass = 'text-gray-600';
        }

        return (
            <div key={item.id} className="bg-white rounded-xl p-4 mb-3 last:mb-0 border border-gray-200">
                <div className="flex justify-between items-start flex-col sm:flex-row sm:items-center">
                    <div className="mb-2 sm:mb-0">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className={`text-sm mt-1 font-medium ${statusColorClass}`}>
                            Status: {item.status}
                        </p>
                        {item.amount && (
                            <p className="text-sm text-gray-600 mt-1">
                                Amount: ₱{item.amount.toLocaleString()}
                            </p>
                        )}
                        {item.startDate && (
                            <p className="text-sm text-gray-600 mt-1">
                                Start: {new Date(item.startDate).toLocaleDateString()}
                            </p>
                        )}
                        {item.endDate && (
                            <p className="text-sm text-gray-600 mt-1">
                                End: {new Date(item.endDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex space-x-2">
                        {actionButtons}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-500">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <div className="max-w-4xl mx-auto pb-20 p-4 sm:p-6 lg:py-8">
                {uploadMessage.text && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${
                        uploadMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">{uploadMessage.text}</span>
                    </div>
                )}

                {/* Profile Details Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="bg-[#061A25] text-white px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Profile</h2>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300 shadow-inner">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-16 h-16 text-gray-500" />
                                        )}
                                    </div>
                                    <label htmlFor="image-upload" className="absolute bottom-0 right-0 bg-black rounded-full p-2 cursor-pointer hover:bg-gray-700 transition-colors shadow-lg ring-2 ring-white">
                                        <CameraIcon className="w-5 h-5 text-white" />
                                        <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                                <label htmlFor="image-upload" className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer shadow-md">
                                    UPLOAD PHOTO
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Maximum 1 MB</p>
                            </div>
                            
                            <div className="flex-1 w-full sm:w-auto">
                                <form onSubmit={handleSave} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="col-span-full">
                                            <label className="block text-sm font-medium text-black mb-2">Email Address</label>
                                            <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
                                        </div>
                                        <div className="col-span-full">
                                            <label htmlFor="full_name" className="block text-sm font-medium text-black mb-2">Full Name</label>
                                            <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#061A25]" placeholder="Enter your full name" />
                                        </div>
                                        <div className="col-span-full">
                                            <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">Phone Number</label>
                                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#061A25]" placeholder="Enter phone number" />
                                        </div>
                                    </div>

                                    <div className="flex justify-center pt-4">
                                        <button type="submit" className="w-full sm:w-auto bg-black text-white px-8 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Bookings Section */}
                <div id="my-bookings" className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mt-6">
                    <div className="bg-[#061A25] text-white px-6 py-4">
                        <h2 className="text-xl font-bold">My Bookings</h2>
                    </div>

                    <div className="border-b border-gray-200 overflow-x-auto bg-gray-50">
                        <div className="flex min-w-max">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap min-w-[20%] transition-colors ${
                                        selectedTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-white">
                        {bookingData[selectedTab].length === 0 ? (
                            <div className="text-center py-8">
                                <BagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No bookings found in this tab.</p>
                            </div>
                        ) : (
                            bookingData[selectedTab].map(renderBookingItem)
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;