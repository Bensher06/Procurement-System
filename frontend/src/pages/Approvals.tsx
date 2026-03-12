import { useState, useEffect } from 'react';
import { requestsAPI, budgetsAPI, suppliersAPI } from '../lib/supabaseApi';
import StatusBadge from '../components/StatusBadge';
import type { RequestWithRelations, Budget } from '../types/database';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShoppingCart,
  Truck,
  CheckSquare
} from 'lucide-react';
import { CenteredAlert } from '../components/CenteredAlert';

const Approvals = () => {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectModal, setRejectModal] = useState<{ show: boolean; id: string | null; reason: string }>({ 
    show: false, 
    id: null, 
    reason: '' 
  });
  const [negotiateModal, setNegotiateModal] = useState<{ show: boolean; id: string | null; notes: string }>({ 
    show: false, 
    id: null, 
    notes: '' 
  });
  const [deliveringModal, setDeliveringModal] = useState<{ show: boolean; id: string | null; bidWinnerId: string; notes: string; attachmentFile: File | null }>({
    show: false,
    id: null,
    bidWinnerId: '',
    notes: '',
    attachmentFile: null
  });
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsData, budgetData, suppliersData] = await Promise.all([
        requestsAPI.getApprovalsQueue(),
        budgetsAPI.getCurrentWithCommitted(),
        suppliersAPI.getAll().then(list => list.map(s => ({ id: s.id, name: s.name })))
      ]);
      // One request per faculty: for each requester_id keep only one (priority: Pending > Approved > Ordered > Received)
      const statusOrder = (s: string) => ({ Pending: 0, Approved: 1, Ordered: 2, Received: 3 }[s] ?? 4);
      const byRequester = new Map<string, RequestWithRelations>();
      (requestsData || []).forEach((r) => {
        const existing = byRequester.get(r.requester_id);
        if (!existing || statusOrder(r.status) < statusOrder(existing.status)) byRequester.set(r.requester_id, r);
      });
      setRequests(Array.from(byRequester.values()));
      setBudget(budgetData);
      setSuppliers(suppliersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await requestsAPI.approve(id);
      setSuccess('Request approved. It remains in the list with progress buttons.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkGatheringSupplies = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await requestsAPI.markOrdered(id);
      setSuccess('Marked as Gathering supplies');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivering = async () => {
    if (!deliveringModal.id) return;
    const id = deliveringModal.id;
    const { bidWinnerId, notes, attachmentFile } = deliveringModal;
    setActionLoading(id);
    setError('');
    setDeliveringModal(prev => ({ ...prev, show: false, id: null, bidWinnerId: '', notes: '', attachmentFile: null }));
    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) attachmentUrl = await requestsAPI.uploadDeliveryAttachment(id, attachmentFile);
      await requestsAPI.markDelivering(id, {
        bid_winner_supplier_id: bidWinnerId || null,
        delivery_notes: notes.trim() || null,
        delivery_attachment_url: attachmentUrl
      });
      setSuccess('Marked as Delivering; faculty will see confirmation.');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update');
      setDeliveringModal(prev => ({ ...prev, show: true, id, bidWinnerId, notes, attachmentFile }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await requestsAPI.markCompleted(id);
      setSuccess('Request completed');
      setRequests(prev => prev.filter(r => r.id !== id));
      fetchData().catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Failed to complete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    const idToReject = rejectModal.id;
    const reason = rejectModal.reason;
    setActionLoading(idToReject);
    setError('');
    setRejectModal({ show: false, id: null, reason: '' });
    try {
      await requestsAPI.reject(idToReject, reason);
      setSuccess('Request rejected');
      setRequests((prev) => prev.filter((r) => r.id !== idToReject));
      fetchData().catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Failed to reject request');
      setRejectModal((prev) => ({ ...prev, show: true, id: idToReject, reason }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleNegotiate = async () => {
    if (!negotiateModal.id) return;
    const idToNegotiate = negotiateModal.id;
    const notes = negotiateModal.notes.trim() || undefined;
    setActionLoading(idToNegotiate);
    setError('');
    setNegotiateModal({ show: false, id: null, notes: '' });
    try {
      await requestsAPI.setNegotiating(idToNegotiate, notes);
      setSuccess('Request sent for negotiation; faculty will be notified.');
      setRequests((prev) => prev.filter((r) => r.id !== idToNegotiate));
      fetchData().catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Failed to send for negotiation');
      setNegotiateModal((prev) => ({ ...prev, show: true, id: idToNegotiate, notes: prev.notes }));
    } finally {
      setActionLoading(null);
    }
  };

  const wouldExceedBudget = (totalPrice: number) => {
    return budget && totalPrice > budget.remaining_amount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-wmsu-black">Pending Approvals</h1>
          <p className="text-base text-gray-500 mt-1">Review and approve procurement requests</p>
        </div>
        {budget && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Available Budget</p>
            <p className="text-xl font-bold text-red-900">₱{budget.remaining_amount.toLocaleString()}</p>
          </div>
        )}
      </div>

      <CenteredAlert
        error={error || undefined}
        success={success || undefined}
        onClose={() => { setError(''); setSuccess(''); }}
      />

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pending requests to approve</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isPending = request.status === 'Pending';
            const isApproved = request.status === 'Approved';
            const isOrdered = request.status === 'Ordered';
            const isReceived = request.status === 'Received';
            return (
            <div
              key={request.id}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                isPending && wouldExceedBudget(request.total_price)
                  ? 'border-orange-200 bg-orange-50/30'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-wmsu-black">{request.item_name}</h3>
                    <StatusBadge status={request.status} size="sm" />
                    {isPending && wouldExceedBudget(request.total_price) && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Exceeds Budget
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Requester</p>
                      <p className="font-medium text-wmsu-black">{request.requester?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium text-wmsu-black">{request.category?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium text-wmsu-black">{request.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="font-medium text-wmsu-black">₱{request.unit_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-lg text-wmsu-black">₱{request.total_price?.toLocaleString()}</p>
                    </div>
                  </div>

                  {request.description && (
                    <p className="text-sm text-gray-600 mt-3">{request.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Submitted {new Date(request.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {isPending && (
                    <>
                      <button
                        onClick={() => setNegotiateModal({ show: true, id: request.id, notes: '' })}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Negotiate
                      </button>
                      <button
                        onClick={() => setRejectModal({ show: true, id: request.id, reason: '' })}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading === request.id || wouldExceedBudget(request.total_price)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={wouldExceedBudget(request.total_price) ? 'Budget exceeded' : ''}
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                    </>
                  )}
                  {isApproved && (
                    <button
                      onClick={() => handleMarkGatheringSupplies(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      Mark as Gathering supplies
                    </button>
                  )}
                  {isOrdered && (
                    <button
                      onClick={() => setDeliveringModal({ show: true, id: request.id, bidWinnerId: '', notes: '', attachmentFile: null })}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" />
                      Mark as Delivering
                    </button>
                  )}
                  {isReceived && (
                    <button
                      onClick={() => handleMarkCompleted(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-wmsu-black mb-4">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this request.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ show: false, id: null, reason: '' })}
                className="px-4 py-2 text-gray-600 hover:text-wmsu-black"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiate Modal */}
      {negotiateModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-wmsu-black mb-4">Request negotiation</h3>
            <p className="text-sm text-gray-600 mb-4">The faculty will be notified. You can add an optional note for them.</p>
            <textarea
              value={negotiateModal.notes}
              onChange={(e) => setNegotiateModal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional note to faculty..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setNegotiateModal({ show: false, id: null, notes: '' })}
                className="px-4 py-2 text-gray-600 hover:text-wmsu-black"
              >
                Cancel
              </button>
              <button
                onClick={handleNegotiate}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send for negotiation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivering Modal */}
      {deliveringModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-wmsu-black mb-4">Mark as Delivering</h3>
            <p className="text-sm text-gray-600 mb-4">Add bid winner and details to send to the requester.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid winner (optional)</label>
                <select
                  value={deliveringModal.bidWinnerId}
                  onChange={(e) => setDeliveringModal(prev => ({ ...prev, bidWinnerId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details for faculty (optional)</label>
                <textarea
                  value={deliveringModal.notes}
                  onChange={(e) => setDeliveringModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Request details, delivery info..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
                <label className="flex flex-col gap-2 cursor-pointer group">
                  <span className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium transition-all duration-200 cursor-pointer group-hover:bg-red-50 group-hover:border-red-200 group-hover:text-red-900 group-hover:shadow-sm min-w-0 max-w-full truncate" title={deliveringModal.attachmentFile?.name}>
                    {deliveringModal.attachmentFile?.name ?? 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setDeliveringModal(prev => ({ ...prev, attachmentFile: e.target.files?.[0] ?? null }))}
                    className="sr-only"
                  />
                  {!deliveringModal.attachmentFile && (
                    <p className="text-xs text-gray-400">PDF, DOC, JPG, PNG (optional)</p>
                  )}
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeliveringModal({ show: false, id: null, bidWinnerId: '', notes: '', attachmentFile: null })}
                className="px-4 py-2 text-gray-600 hover:text-wmsu-black"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkDelivering}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Mark as Delivering'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;

