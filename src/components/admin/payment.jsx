import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          rooms(room_number),
          tenants(tenant_name, profiles(full_name))
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ payment_status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;

      alert(`Payment status updated to ${newStatus}`);
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment status');
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'All') return true;
    return payment.payment_status === filter;
  });

  const totalAmount = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const pendingAmount = payments
    .filter(p => p.payment_status === 'Pending')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                ₱{totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Pending Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">
                ₱{pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Transactions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {payments.length}
              </p>
            </div>
            <div className="bg-gray-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-500">Admin Payment Management</p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Management</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Paid', 'Pending', 'Failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  filter === status
                    ? 'bg-[#051A2C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading payments...</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No payments found
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Room {payment.rooms?.room_number || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {payment.tenants?.tenant_name || payment.tenants?.profiles?.full_name || 'N/A'}
                        </p>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                        payment.payment_status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.payment_status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      ₱{parseFloat(payment.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600 font-mono truncate">
                      Ref: {payment.reference_no || payment.stripe_payment_intent_id || 'N/A'}
                    </p>
                    <select
                      value={payment.payment_status}
                      onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#051A2C]"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Room</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Reference</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-gray-500 text-sm">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-800">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900">
                          Room {payment.rooms?.room_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-800">
                          {payment.tenants?.tenant_name || payment.tenants?.profiles?.full_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm font-semibold text-green-600">
                          ₱{parseFloat(payment.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                          {payment.reference_no || payment.stripe_payment_intent_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                            payment.payment_status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {payment.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={payment.payment_status}
                            onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                            className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#051A2C]"
                          >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}