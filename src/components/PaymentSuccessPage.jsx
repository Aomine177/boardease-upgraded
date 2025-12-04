// PaymentSuccessPage.jsx - Success & Database Updates
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/authcontext';
import Header from '../../components/Header';
import Footer from '../../components/footer';

const PaymentSuccessPage = () => {
  const { id } = useParams(); // booking_request id
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && user) {
      handlePaymentSuccess();
    }
  }, [id, user]);

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentIntent = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      console.log('🔵 ===== PAYMENT SUCCESS FLOW START =====');
      console.log('🔵 Booking ID:', id);
      console.log('🔵 User ID:', user.id);
      console.log('🔵 Payment Intent:', paymentIntent);
      console.log('🔵 Redirect Status:', redirectStatus);

      // STEP 1: Fetch booking with room details
      console.log('🔵 STEP 1: Fetching booking details...');
      const { data: bookingData, error: bookingError } = await supabase
        .from('booking_requests')
        .select('*, rooms(*)')
        .eq('id', id)
        .eq('requestor', user.id)
        .single();

      if (bookingError) {
        console.error('❌ Booking fetch error:', bookingError);
        throw new Error(bookingError.code === 'PGRST116' 
          ? 'Booking not found.'
          : `Failed to verify booking: ${bookingError.message}`
        );
      }

      if (!bookingData) {
        throw new Error('Booking does not exist.');
      }

      console.log('✅ Booking fetched:', bookingData.id);
      setBooking(bookingData);
      setRoom(bookingData.rooms);

      // Check if already processed
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent)
        .maybeSingle();

      if (existingPayment) {
        console.log('⚠️ Payment already processed, skipping...');
        setLoading(false);
        return;
      }

      // STEP 2: Check if tenant exists, create if not
      console.log('🔵 STEP 2: Checking tenant record...');
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('room_id', bookingData.room_id)
        .maybeSingle();

      let tenantId = existingTenant?.id;

      if (!tenantId) {
        console.log('🔵 Creating new tenant record...');
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            profile_id: user.id,
            room_id: bookingData.room_id,
            move_in_date: new Date().toISOString().split('T')[0],
            status: 'Active'
          })
          .select()
          .single();

        if (tenantError) {
          console.error('❌ Tenant creation error:', tenantError);
          throw new Error('Failed to create tenant record');
        }

        tenantId = newTenant.id;
        console.log('✅ Tenant created:', tenantId);
      }

      // STEP 3: Create payment record
      console.log('🔵 STEP 3: Creating payment record...');
      const paymentData = {
        tenant_id: tenantId,
        room_id: bookingData.room_id,
        recorded_by: user.id,
        payment_date: new Date().toISOString().split('T')[0],
        amount: bookingData.rooms.price_monthly,
        payment_status: 'Paid',
        reference_no: paymentIntent || `ref_${Date.now()}`,
        stripe_payment_intent_id: paymentIntent,
        payment_method: 'stripe',
        currency: 'PHP',
        paid_at: new Date().toISOString(),
        notes: `Stripe Payment for Room ${bookingData.rooms.room_number} - Booking Request #${bookingData.id}`
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) {
        console.error('❌ Payment insert failed:', paymentError);
        throw new Error(`Failed to save payment: ${paymentError.message}`);
      }

      console.log('✅ Payment record created');

      // STEP 4: Create payment transaction record (if table exists)
      if (paymentIntent) {
        console.log('🔵 STEP 4: Creating payment transaction...');
        const transactionData = {
          booking_id: bookingData.id,
          transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_method: 'stripe',
          amount: parseFloat(bookingData.rooms.price_monthly),
          currency: 'PHP',
          status: 'succeeded',
          stripe_payment_intent_id: paymentIntent,
          stripe_charge_id: paymentIntent,
          gateway_response: {
            payment_intent: paymentIntent,
            processed_at: new Date().toISOString(),
            booking_id: bookingData.id
          }
        };

        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .insert(transactionData);

        if (transactionError) {
          console.warn('⚠️ Transaction record failed (table may not exist):', transactionError);
        } else {
          console.log('✅ Payment transaction recorded');
        }
      }

      // STEP 5: Update booking status
      console.log('🔵 STEP 5: Updating booking status...');
      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({
          status: 'Approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.warn('⚠️ Booking update failed:', updateError);
      } else {
        console.log('✅ Booking status updated to Approved');
      }

      // STEP 6: Update room status to Occupied
      console.log('🔵 STEP 6: Updating room status...');
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          status: 'Occupied',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData.room_id);

      if (roomError) {
        console.warn('⚠️ Room update failed:', roomError);
      } else {
        console.log('✅ Room status updated to Occupied');
      }

      // STEP 7: Send notification to user
      console.log('🔵 STEP 7: Sending notification...');
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          from_user: 'System',
          message: `Your payment for Room ${bookingData.rooms.room_number} has been confirmed. Amount: ₱${bookingData.rooms.price_monthly.toLocaleString()}. Your booking is now approved!`,
          type: 'payment',
          is_read: false
        });

      if (notifError) {
        console.warn('⚠️ Notification failed:', notifError);
      } else {
        console.log('✅ Notification sent');
      }

      console.log('✅✅✅ PAYMENT SUCCESS FLOW COMPLETE ✅✅✅');
      setLoading(false);
      
    } catch (err) {
      console.error('❌❌❌ PAYMENT SUCCESS FLOW FAILED ❌❌❌');
      console.error('Error:', err);
      setError(err.message || 'Failed to confirm payment');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#061A25] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Confirming your payment...</p>
          <p className="text-sm text-gray-500 mt-2">⏳ Processing booking & updating records</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmation Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Your payment may have been successful. Please check your bookings or contact support.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/profile#my-bookings')}
                className="w-full bg-[#061A25] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0a2433] transition-colors"
              >
                VIEW MY BOOKINGS
              </button>
              <button
                onClick={() => navigate('/availableroom')}
                className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                BROWSE ROOMS
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const monthlyAmount = room?.price_monthly || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful! 🎉
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Thank you! Your booking has been confirmed and payment received.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room Number</span>
                  <span className="font-semibold text-gray-900">{room?.room_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room Type</span>
                  <span className="font-medium text-gray-900">{room?.room_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rental Term</span>
                  <span className="font-medium text-gray-900">{room?.rental_term}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="font-semibold text-gray-900">₱{monthlyAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="font-semibold text-gray-900">Credit/Debit Card (Stripe)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    ✓ PAID
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    ✓ APPROVED
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-bold text-blue-900 mb-3">What's Next?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>✉️ Confirmation sent to your email</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>🏠 Room is now reserved for you</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>📞 Admin will contact you for move-in details</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>📱 Track your booking status in your profile</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/profile#my-bookings')}
                className="flex-1 bg-[#061A25] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0a2433] transition-colors"
              >
                VIEW MY BOOKINGS
              </button>
              <button
                onClick={() => navigate('/availableroom')}
                className="flex-1 bg-white text-[#061A25] border-2 border-[#061A25] py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                BROWSE MORE ROOMS
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">Need help with your booking?</p>
            <a 
              href="mailto:support@yourdomain.com" 
              className="text-[#061A25] font-semibold hover:underline text-sm"
            >
              📧 Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;