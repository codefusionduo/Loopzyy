
import React, { useState, useEffect } from 'react';
import { getPendingVerificationRequests, approveVerification, rejectVerification } from '../services/verificationService';
import { getReports, resolveReport, banUser, deleteReportedContent } from '../services/reportService';
import { VerificationRequest, Report } from '../types';
import { Check, X, Shield, Loader2, Maximize2, Flag, AlertTriangle, Trash2, Ban } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports'>('verifications');
  
  // Verification State
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  
  // Reports State
  const [reports, setReports] = useState<Report[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'verifications') {
         const data = await getPendingVerificationRequests();
         setVerifications(data);
      } else {
         const data = await getReports();
         setReports(data);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Verification Handlers ---
  const handleApproveVerify = async (request: VerificationRequest) => {
    // Removed window.confirm for smoother UX
    setProcessingId(request.id);
    try {
      await approveVerification(request.id, request.userId);
      setVerifications(prev => prev.filter(r => r.id !== request.id));
      // Optional: Use a toast notification here if available, defaulting to no alert for speed
    } catch (error) {
      console.error("Verification failed", error);
      alert("Error approving request. Please check console.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectVerify = async (request: VerificationRequest) => {
    // Removed window.confirm for smoother UX
    setProcessingId(request.id);
    try {
      await rejectVerification(request.id, request.userId);
      setVerifications(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Rejection failed", error);
      alert("Error rejecting request. Please check console.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Report Handlers ---
  const handleBanUser = async (report: Report) => {
      if (!window.confirm(`Ban user associated with this report?`)) return;
      setProcessingId(report.id);
      try {
          // Determine user ID based on target type
          const userIdToBan = report.targetType === 'user' ? report.targetId : report.targetId; // simplified assumption, ideally we'd look up post author
          await banUser(userIdToBan);
          await resolveReport(report.id, 'resolved');
          setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
          alert("User banned successfully.");
      } catch (error) {
          alert("Failed to ban user.");
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteContent = async (report: Report) => {
      if (!window.confirm("Permanently delete this content?")) return;
      setProcessingId(report.id);
      try {
          await deleteReportedContent(report.targetType, report.targetId);
          await resolveReport(report.id, 'resolved');
           setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
          alert("Content deleted.");
      } catch (error) {
          alert("Failed to delete content.");
      } finally {
          setProcessingId(null);
      }
  };

  const handleDismissReport = async (report: Report) => {
      setProcessingId(report.id);
      try {
          await resolveReport(report.id, 'dismissed');
          setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r));
      } catch (error) {
          alert("Failed to dismiss.");
      } finally {
          setProcessingId(null);
      }
  };

  // Analytics
  const reportStats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center gap-3 mb-6 px-2">
         <Shield className="w-8 h-8 text-brand-500" />
         <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 text-sm">Community Management</p>
         </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 mb-6 px-2">
          <button 
            onClick={() => setActiveTab('verifications')}
            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'verifications' ? 'text-brand-400' : 'text-zinc-500 hover:text-white'}`}
          >
            Verifications
            {activeTab === 'verifications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'reports' ? 'text-brand-400' : 'text-zinc-500 hover:text-white'}`}
          >
            Reports
            {activeTab === 'reports' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />}
          </button>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-lg" />
            <button className="absolute top-4 right-4 bg-zinc-800 p-2 rounded-full text-white">
                <X className="w-6 h-6" />
            </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : activeTab === 'verifications' ? (
         // --- VERIFICATION LIST ---
         verifications.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <Check className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No pending verifications.</p>
            </div>
         ) : (
            <div className="space-y-6">
                {verifications.map(req => (
                    <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                         <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <img src={req.userAvatar} alt="avatar" className="w-12 h-12 rounded-full border border-zinc-700" />
                                <div>
                                    <h3 className="font-bold text-lg text-white">{req.userName}</h3>
                                    <p className="text-brand-400">@{req.userHandle}</p>
                                    <p className="text-zinc-500 text-xs mt-1">ID: {req.id}</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
                                {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Gov ID</p>
                                <div className="relative group rounded-xl overflow-hidden bg-black border border-zinc-800 aspect-video cursor-pointer" onClick={() => setPreviewImage(req.uploadedIdUrl)}>
                                    <img src={req.uploadedIdUrl} alt="ID" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                        <Maximize2 className="text-white w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Selfie</p>
                                <div className="relative group rounded-xl overflow-hidden bg-black border border-zinc-800 aspect-video cursor-pointer" onClick={() => setPreviewImage(req.uploadedSelfieUrl)}>
                                    <img src={req.uploadedSelfieUrl} alt="Selfie" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                        <Maximize2 className="text-white w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleRejectVerify(req)}
                                disabled={!!processingId}
                                className="flex-1 py-3 rounded-xl border border-red-900/30 text-red-400 hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                Reject
                            </button>
                            <button 
                                onClick={() => handleApproveVerify(req)}
                                disabled={!!processingId}
                                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Verify
                            </button>
                        </div>
                    </div>
                ))}
            </div>
         )
      ) : (
         // --- REPORTS LIST ---
         <div className="space-y-6">
            {/* Analytics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-bold">Total</p>
                    <p className="text-2xl font-bold text-white">{reportStats.total}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-bold">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">{reportStats.pending}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-bold">Resolved</p>
                    <p className="text-2xl font-bold text-green-500">{reportStats.resolved}</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                    <Flag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">No reports found.</p>
                </div>
            ) : (
                reports.map(report => (
                    <div key={report.id} className={`bg-zinc-900 border ${report.status === 'pending' ? 'border-yellow-900/50' : 'border-zinc-800'} rounded-2xl p-6 shadow-xl relative overflow-hidden`}>
                        {report.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
                        
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        report.targetType === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'
                                    }`}>
                                        {report.targetType}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                                        report.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                                    }`}>
                                        {report.status}
                                    </span>
                                </div>
                                <h3 className="text-white font-bold mt-2">Reason: {report.reason}</h3>
                                <p className="text-zinc-500 text-xs mt-1">
                                    Reported by: <span className="text-zinc-300">{report.reporterId}</span> • {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                             </div>
                             
                             {/* Target ID visual */}
                             <div className="text-right">
                                <p className="text-zinc-500 text-xs">Target ID</p>
                                <p className="font-mono text-zinc-300 text-xs bg-black px-2 py-1 rounded">{report.targetId}</p>
                             </div>
                        </div>

                        {report.additionalInfo && (
                            <div className="bg-zinc-950/50 p-3 rounded-xl mb-4 text-sm text-zinc-300 border border-zinc-800/50">
                                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Additional Info</p>
                                {report.additionalInfo}
                            </div>
                        )}

                        {report.status === 'pending' && (
                            <div className="flex gap-3 mt-4 border-t border-zinc-800/50 pt-4">
                                <button 
                                    onClick={() => handleDismissReport(report)}
                                    disabled={!!processingId}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 transition-colors text-sm"
                                >
                                    Dismiss
                                </button>
                                {report.targetType === 'user' && (
                                    <button 
                                        onClick={() => handleBanUser(report)}
                                        disabled={!!processingId}
                                        className="flex-1 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <Ban className="w-4 h-4" /> Ban User
                                    </button>
                                )}
                                {report.targetType === 'post' && (
                                     <button 
                                        onClick={() => handleDeleteContent(report)}
                                        disabled={!!processingId}
                                        className="flex-1 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Content
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
         </div>
      )}
    </div>
  );
};
