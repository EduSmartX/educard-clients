/**
 * Parent Dashboard Page
 *
 * Motion-rich dashboard for parent role with animated greeting,
 * staggered stat cards, and hover micro-interactions.
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, BarChart3, CalendarDays, Bell, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const STAGGER_CHILDREN = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
} as const;

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) {
    return { text: 'Good Morning', emoji: '☀️' };
  }
  if (h < 17) {
    return { text: 'Good Afternoon', emoji: '🌤️' };
  }
  return { text: 'Good Evening', emoji: '🌙' };
}

function AnimatedNumber({ value }: { value: number | string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.span
      ref={ref}
      className="text-2xl font-bold"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
    >
      {value}
    </motion.span>
  );
}

const STATS = [
  {
    label: 'My Children',
    value: 2,
    sub: 'All active',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    gradient: 'bg-gradient-to-br from-blue-500/90 to-indigo-600/90',
    icon: Users,
  },
  {
    label: 'Attendance This Month',
    value: '97%',
    sub: 'Excellent attendance',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    gradient: 'bg-gradient-to-br from-emerald-500/90 to-teal-600/90',
    icon: BarChart3,
  },
  {
    label: 'Upcoming Events',
    value: 3,
    sub: 'This week',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-violet-500/90 to-purple-600/90',
    icon: CalendarDays,
  },
  {
    label: 'Notifications',
    value: 5,
    sub: '2 unread',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
    gradient: 'bg-gradient-to-br from-orange-500/90 to-amber-600/90',
    icon: Bell,
  },
] as const;

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'Parent';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-3 py-4 sm:p-6">
      {/* Animated Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-violet-500/20 sm:p-8"
      >
        <motion.div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.05, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium text-white/70">{formattedDate}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {greeting.text}, {firstName}! {greeting.emoji}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-1.5 text-sm text-white/75 sm:text-base"
          >
            Here&apos;s an overview of your children&apos;s progress
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Your children are doing great!</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        variants={STAGGER_CHILDREN}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={FADE_UP}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${stat.gradient}`} />
                <CardContent className="relative z-10 p-5">
                  <div className="flex items-center gap-4">
                    <div className={`shrink-0 rounded-xl p-3 ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                        {stat.label}
                      </p>
                      <div className="transition-colors duration-300 group-hover:text-white">
                        <AnimatedNumber value={stat.value} />
                      </div>
                      <p className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-white/60">
                        {stat.sub}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Role Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Your current role and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Role:</strong> Parent / Guardian</p>
              <p><strong>Access Level:</strong> Parent/Guardian</p>
              <p className="text-sm text-muted-foreground">
                As a parent, you can view your children&apos;s attendance, apply for leave on their behalf,
                and stay updated with school activities and notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
