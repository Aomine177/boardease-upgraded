import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/authcontext';

export default function Tenants() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchBookingRequests();
    fetchCancelledBookings();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*, rooms(room_number)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      alert('Error loading tenants: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*, rooms(room_number, price_monthly)')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', request.requestor)
            .single();
          
          return {
            ...request,
            profiles: profile || { full_name: 'Unknown User', phone: 'N/A' }
          };
        })
      );
      
      setBookingRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    }
  };

  const fetchCancelledBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*, rooms(room_number, price_monthly)')
        .eq('status', 'Cancelled')
        .order('decided_at', { ascending: false });

      if (error) throw error;
      
      const cancelledWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', request.requestor)
            .single();
          
          return {
            ...request,
            profiles: profile || { full_name: 'Unknown User', phone: 'N/A' }
          };
        })
      );
      
      setCancelledBookings(cancelledWithProfiles);
    } catch (error) {
      console.error('Error fetching cancelled bookings:', error);
    }
  };

  const handleSendReminder = async (e) => {
    e.preventDefault();
    
    if (!selectedTenant) {
      alert('Please select a tenant');
      return;
    }

    const formData = new FormData(e.target);
    const message = formData.get('message');

    try {
      setLoading(true);

      const tenant = tenants.find(t => t.id === parseInt(selectedTenant));
      
      if (!tenant) {
        alert('Tenant not found');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: tenant.profile_id,
          from_user: 'Landlord',
          message: message,
          type: 'reminder',
          is_read: false
        }]);

      if (error) throw error;

      alert('Reminder sent successfully!');
      setShowReminder(false);
      setSelectedTenant('');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const formData = new FormData(e.target);
    const approval = formData.get('approval');
    const message = formData.get('message');
    const checkIn = formData.get('checkIn');
    const checkOut = formData.get('checkOut');

    try {
      setLoading(true);

      if (approval === 'Approve') {
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert([{
            room_id: selectedRequest.room_id,
            profile_id: selectedRequest.requestor,
            tenant_name: selectedRequest.profiles?.full_name || 'Unknown',
            rent_start: checkIn,
            rent_due: checkOut,
            status: 'Active'
          }]);

        if (tenantError) throw tenantError;

        const { error: roomError } = await supabase
          .from('rooms')
          .update({ status: 'Occupied' })
          .eq('id', selectedRequest.room_id);

        if (roomError) throw roomError;

        await supabase
          .from('notifications')
          .insert([{
            user_id: selectedRequest.requestor,
            from_user: 'Landlord',
            message: `Your booking for Room ${selectedRequest.rooms?.room_number} has been approved! ${message}`,
            type: 'booking',
            is_read: false
          }]);
      } else {
        await supabase
          .from('notifications')
          .insert([{
            user_id: selectedRequest.requestor,
            from_user: 'Landlord',
            message: `Your booking for Room ${selectedRequest.rooms?.room_number} has been declined. ${message}`,
            type: 'booking',
            is_read: false
          }]);
      }

      const { error: bookingError } = await supabase
        .from('booking_requests')
        .update({ 
          status: approval === 'Approve' ? 'Approved' : 'Declined',
          message: message,
          decided_by: user?.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (bookingError) throw bookingError;

      alert(`Booking ${approval === 'Approve' ? 'approved' : 'declined'} successfully!`);
      setShowBooking(false);
      setSelectedRequest(null);
      fetchTenants();
      fetchBookingRequests();
    } catch (error) {
      console.error('Error processing booking:', error);
      alert('Error processing booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTenant = async (tenantId, roomId, profileId) => {
    if (!confirm('Are you sure you want to remove this tenant?')) return;

    try {
      setLoading(true);

      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ status: 'Inactive' })
        .eq('id', tenantId);

      if (tenantError) throw tenantError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'Available' })
        .eq('id', roomId);

      if (roomError) throw roomError;

      await supabase
        .from('notifications')
        .insert([{
          user_id: profileId,
          from_user: 'Landlord',
          message: 'Your tenancy has been terminated. Please contact the landlord for more details.',
          type: 'maintenance',
          is_read: false
        }]);

      alert('Tenant removed successfully!');
      fetchTenants();
    } catch (error) {
      console.error('Error removing tenant:', error);
      alert('Error removing tenant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const activeTenants = tenants.filter(t => t.status === 'Active');
  const pendingBookings = bookingRequests.length;

  return (
    <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200 pb-4">
        <div>
          <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-500">
            Admin Tenant Management
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Tenants Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Active: {activeTenants.length} | Pending: {pendingBookings} | Cancelled: {cancelledBookings.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => setShowReminder(true)}
            className="flex-1 sm:flex-none rounded-md bg-black px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-gray-900"
          >
            Remind Due Date
          </button>

          <button 
            onClick={() => setShowBooking(true)}
            className="flex-1 sm:flex-none rounded-md bg-black px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-gray-900"
          >
            Accept Booking ({pendingBookings})
          </button>

          <button 
            onClick={() => setShowCancelled(true)}
            className="flex-1 sm:flex-none rounded-md bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            View Cancelled ({cancelledBookings.length})
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-5 bg-gray-100 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-700">
          <span>Room no.</span>
          <span>Tenant name</span>
          <span>Rent Start</span>
          <span>Rent Due</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Loading tenants...
          </div>
        ) : tenants.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No tenants yet. Approve booking requests to add tenants.
          </div>
        ) : (
          tenants.map((tenant) => (
            <div key={tenant.id}>
              {/* Mobile Card View */}
              <div className="md:hidden border-t border-gray-100 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Room {tenant.rooms?.room_number || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{tenant.tenant_name}</p>
                  </div>
                  {tenant.status === 'Active' ? (
                    <button 
                      onClick={() => handleRemoveTenant(tenant.id, tenant.room_id, tenant.profile_id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400">Inactive</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-medium">Start:</span> {new Date(tenant.rent_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p><span className="font-medium">Due:</span> {new Date(tenant.rent_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Desktop Table Row */}
              <div className="hidden md:grid md:grid-cols-5 px-4 py-3 text-xs sm:text-sm text-gray-800 border-t border-gray-100">
                <span className="font-semibold">Room {tenant.rooms?.room_number || 'N/A'}</span>
                <span>{tenant.tenant_name}</span>
                <span>{new Date(tenant.rent_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{new Date(tenant.rent_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-right">
                  {tenant.status === 'Active' ? (
                    <button 
                      onClick={() => handleRemoveTenant(tenant.id, tenant.room_id, tenant.profile_id)}
                      className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-gray-400">Inactive</span>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORMS */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mt-4 sm:mt-6">
        {/* Remind Due Date */}
        {showReminder && (
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Notif Users</h3>
              <button 
                onClick={() => setShowReminder(false)}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="mt-4 sm:mt-6 space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Tenants *</label>
                <select 
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                >
                  <option value="">Select Tenants</option>
                  {activeTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.tenant_name} - Room {tenant.rooms?.room_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Reminders</label>
                <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none">
                  <option>Due Date</option>
                  <option>Three Days Due date</option>
                  <option>Seven Days Due date</option>
                </select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Message *</label>
                <textarea
                  name="message"
                  rows={4}
                  defaultValue="This is a reminder that your due date is today."
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowReminder(false)}
                  className="text-sm font-semibold text-gray-500 hover:text-black order-2 sm:order-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-md bg-[#051A2C] px-6 py-2 text-sm font-semibold text-white shadow hover:bg-[#031121] disabled:opacity-50 order-1 sm:order-2"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accept Booking */}
        {showBooking && (
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Accept Booking</h3>
              <button 
                onClick={() => {
                  setShowBooking(false);
                  setSelectedRequest(null);
                }}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No pending booking requests
              </div>
            ) : (
              <form onSubmit={handleApproveBooking} className="mt-4 sm:mt-6 space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Requests *</label>
                  <select 
                    name="requestId"
                    onChange={(e) => {
                      const request = bookingRequests.find(r => r.id === parseInt(e.target.value));
                      setSelectedRequest(request);
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    required
                  >
                    <option value="">Select Request</option>
                    {bookingRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.profiles?.full_name || 'Unknown'} - Room {request.rooms?.room_number}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRequest && (
                  <>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2 text-xs sm:text-sm">
                      <p><strong>Tenant:</strong> {selectedRequest.profiles?.full_name}</p>
                      <p><strong>Phone:</strong> {selectedRequest.profiles?.phone}</p>
                      <p><strong>Room:</strong> {selectedRequest.rooms?.room_number}</p>
                      <p><strong>Price:</strong> ₱{selectedRequest.rooms?.price_monthly?.toLocaleString()}/mo</p>
                      <p><strong>Message:</strong> {selectedRequest.message}</p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-700">Check-in Date *</label>
                      <input
                        type="date"
                        name="checkIn"
                        required
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-700">Check-out Date *</label>
                      <input
                        type="date"
                        name="checkOut"
                        required
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-700">Approval *</label>
                      <select 
                        name="approval"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        required
                      >
                        <option>Decline</option>
                        <option>Approve</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-700">Message</label>
                      <textarea
                        name="message"
                        rows={4}
                        defaultValue="This is from BoardEase. Please pay after booking confirmation."
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowBooking(false);
                          setSelectedRequest(null);
                        }}
                        className="text-sm font-semibold text-gray-500 hover:text-black order-2 sm:order-1"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto rounded-md bg-[#051A2C] px-6 py-2 text-sm font-semibold text-white shadow hover:bg-[#031121] disabled:opacity-50 order-1 sm:order-2"
                      >
                        {loading ? 'Processing...' : 'Add'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {/* View Cancelled Bookings */}
        {showCancelled && (
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-gray-200 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Cancelled Bookings</h3>
              <button 
                onClick={() => setShowCancelled(false)}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            {cancelledBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No cancelled bookings
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 space-y-3">
                {cancelledBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {booking.profiles?.full_name || 'Unknown'} - Room {booking.rooms?.room_number}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Phone: {booking.profiles?.phone || 'N/A'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Price: ₱{booking.rooms?.price_monthly?.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Cancelled: {new Date(booking.decided_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold w-fit">
                        CANCELLED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}