"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getEventRegistrants } from "../../../app/actions/events";
import { toast } from "sonner";

type Registrant = {
  id: string;
  user: {
    fullName: string;
    email: string;
    phoneNumber: string | null;
    collegeName: string;
    graduationYear: number | null;
    avatar: string | null;
  };
  createdAt: string;
};

export function EventRegistrantsModal({ 
  isOpen, 
  onClose, 
  event 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  event: { id: string; title: string; maxCapacity: number | null; _count: { registrations: number } } | null 
}) {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setLoading(true);
      getEventRegistrants(event.id)
        .then((data) => setRegistrants(data as any))
        .catch((err) => {
          toast.error(err.message || "Failed to load registrants");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, event, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0D0F1C] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] border-b border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-white">Event Registrants</h2>
                <p className="text-xs text-white/40 mt-0.5">{event?.title} • {event?._count.registrations} students</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 text-white/40 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 text-[#5227FF] animate-spin" />
                  <p className="text-sm text-white/20 font-medium">Fetching student list...</p>
                </div>
              ) : registrants.length > 0 ? (
                registrants.map((reg) => (
                  <motion.div key={reg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#5227FF]/10 flex items-center justify-center border border-[#5227FF]/20 overflow-hidden">
                         {reg.user.avatar ? (
                           <img src={reg.user.avatar} className="h-full w-full object-cover" alt="" />
                         ) : (
                           <span className="text-sm font-black text-[#5227FF]">{reg.user.fullName[0]}</span>
                         )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-[#8C6DFD] transition-colors">{reg.user.fullName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" /> {reg.user.collegeName}
                           </span>
                           {reg.user.graduationYear && (
                             <span className="text-[10px] font-bold text-[#5227FF] bg-[#5227FF]/10 px-1.5 py-0.5 rounded">Class of {reg.user.graduationYear}</span>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-xs text-white/60 font-medium">
                          <Mail className="h-3 w-3 text-[#5227FF]" /> {reg.user.email}
                        </p>
                        <p className="flex items-center gap-2 text-xs text-white/60 font-medium border-t border-white/[0.05] pt-1 mt-1">
                          <Phone className="h-3 w-3 text-[#5227FF]" /> {reg.user.phoneNumber || "No phone"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-white/20">Registered On</p>
                        <p className="text-xs font-bold text-white/40">{format(new Date(reg.createdAt), "dd MMM, HH:mm")}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Users className="h-12 w-12 text-white/5 mb-4" />
                  <p className="text-lg font-bold text-white/40">No Registrants Yet</p>
                  <p className="text-xs text-white/20 mt-1 max-w-[200px]">Once students join the event, their details will appear here.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/[0.06] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/20">
              <span>Real-time Data Sync</span>
              <span className="text-white/40">Total Capacity: {event?.maxCapacity || "Unlimited"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
