import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from '@/lib/router-compat';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Activity,
  ArrowRight,
  Sparkles,
  Award,
  Target
} from 'lucide-react';

export function DashboardHome() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Clubs', value: '24', icon: Users, color: 'from-[#C9A96E]/35 to-[#C9A96E]/10' },
    { label: 'Upcoming Events', value: '12', icon: Calendar, color: 'from-[#C9A96E]/35 to-[#C9A96E]/10' },
    { label: 'Members', value: '1.2K', icon: TrendingUp, color: 'from-[#C9A96E]/35 to-[#C9A96E]/10' },
    { label: 'Engagement', value: '85%', icon: Activity, color: 'from-[#C9A96E]/35 to-[#C9A96E]/10' },
  ];

  const featuredClubs = [
    {
      id: 1,
      name: 'Tech Innovators',
      category: 'Technology',
      members: 245,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400',
      color: 'cyan',
    },
    {
      id: 2,
      name: 'Arts & Culture',
      category: 'Creative',
      members: 189,
      image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
      color: 'purple',
    },
    {
      id: 3,
      name: 'Fitness Enthusiasts',
      category: 'Sports',
      members: 312,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      color: 'orange',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Hackathon 2026',
      club: 'Tech Innovators',
      date: 'Apr 15, 2026',
      time: '9:00 AM',
      attendees: 45,
    },
    {
      id: 2,
      title: 'Art Exhibition',
      club: 'Arts & Culture',
      date: 'Apr 18, 2026',
      time: '2:00 PM',
      attendees: 32,
    },
    {
      id: 3,
      title: 'Basketball Tournament',
      club: 'Fitness Enthusiasts',
      date: 'Apr 20, 2026',
      time: '4:00 PM',
      attendees: 64,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090908] text-[#F5F0E8] space-y-8 px-6 py-10">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C9A96E]/30 via-[#C9A96E]/10 to-[#090908] p-8 md:p-12"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white/80 font-medium">Welcome back!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Your Campus Community Hub
          </h1>
          <p className="text-white/90 text-lg mb-6 max-w-2xl">
            Discover clubs, connect with students, and make the most of your campus experience.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/dashboard/discover')}
              className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Explore Clubs
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard/create-club')}
              className="px-6 py-3 bg-white/20 backdrop-blur-xl text-white border border-white/30 rounded-full font-semibold hover:bg-white/30 transition-colors"
            >
              Create Club
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A96E]/20 rounded-full blur-3xl" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Clubs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Featured Clubs</h2>
          <button
            onClick={() => navigate('/dashboard/discover')}
            className="text-[#C9A96E] hover:text-[#D6C07A] font-medium flex items-center gap-2"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/dashboard/clubs/${club.id}`)}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-xs text-white font-medium mb-2">
                      {club.category}
                    </span>
                    <h3 className="text-xl font-bold text-white">{club.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Users className="w-4 h-4" />
                      <span>{club.members} members</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Upcoming Events</h2>
          <button
            onClick={() => navigate('/dashboard/events')}
            className="text-[#C9A96E] hover:text-[#D6C07A] font-medium flex items-center gap-2"
          >
            View Calendar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#C9A96E] transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-3">{event.club}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-4 py-2 bg-[#C9A96E]/20 rounded-full text-[#C9A96E] text-sm font-medium">
                    {event.time}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/dashboard/my-clubs')}
          className="rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/10 border border-[#C9A96E]/25 p-6 hover:border-[#C9A96E]/50 transition-all cursor-pointer group"
        >
          <Award className="w-8 h-8 text-[#C9A96E] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">My Clubs</h3>
          <p className="text-white/60 text-sm">View and manage your club memberships</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/dashboard/events')}
          className="rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/10 border border-[#C9A96E]/25 p-6 hover:border-[#C9A96E]/50 transition-all cursor-pointer group"
        >
          <Calendar className="w-8 h-8 text-[#C9A96E] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Events Calendar</h3>
          <p className="text-white/60 text-sm">Discover and join upcoming events</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/dashboard/profile')}
          className="rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/10 border border-[#C9A96E]/25 p-6 hover:border-[#C9A96E]/50 transition-all cursor-pointer group"
        >
          <Target className="w-8 h-8 text-[#C9A96E] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Your Profile</h3>
          <p className="text-white/60 text-sm">Update your profile and preferences</p>
        </motion.div>
      </div>
    </div>
  );
}
