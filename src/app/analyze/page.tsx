'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Zap, Calendar, ArrowRight, Check, Sparkles } from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';
import MagneticButton from '@/components/MagneticButton';

const easing = [0.16, 1, 0.3, 1] as const;

// 15 kWp system calculations (Malta three-phase max)
// 15 kWp × 1.5 MWh/kWp = 23 MWh/year (22,500 kWh)
// €150/MWh feed-in tariff = €3,450/year income
// Monthly average: €287.50
const cumulativeSavingsData = [
  { month: 'Jan', savings: 196, cumulative: 196 },
  { month: 'Feb', savings: 217, cumulative: 413 },
  { month: 'Mar', savings: 266, cumulative: 679 },
  { month: 'Apr', savings: 295, cumulative: 974 },
  { month: 'May', savings: 337, cumulative: 1311 },
  { month: 'Jun', savings: 365, cumulative: 1676 },
  { month: 'Jul', savings: 386, cumulative: 2062 },
  { month: 'Aug', savings: 372, cumulative: 2434 },
  { month: 'Sep', savings: 316, cumulative: 2750 },
  { month: 'Oct', savings: 273, cumulative: 3023 },
  { month: 'Nov', savings: 224, cumulative: 3247 },
  { month: 'Dec', savings: 203, cumulative: 3450 },
];

const yearlyComparison = [
  { year: 'Year 1', cost: 5040, label: '€5,040' },
  { year: 'Year 5', cost: 5040, label: '€5,040' },
  { year: 'Year 10', cost: 5040, label: '€5,040' },
  { year: 'Year 15', cost: 5040, label: '€5,040' },
  { year: 'Year 20', cost: 5040, label: '€5,040' },
];

const paybackTimeline = [
  { year: 0, value: -5000, label: 'Investment' },
  { year: 1, value: -1550 },
  { year: 2, value: 1900, label: 'Break Even!' },
  { year: 3, value: 5350 },
  { year: 4, value: 8800 },
  { year: 5, value: 12250 },
  { year: 10, value: 29500 },
  { year: 15, value: 46750 },
  { year: 20, value: 64000, label: '€64k Profit!' },
];

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Hero Impact Section - MASSIVE SAVINGS NUMBER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1f1f1f] via-[#1a1a1a] to-[#1a1a1a] pt-32 pb-20">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-red-500/20 to-amber-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easing }}
            className="inline-flex items-center gap-2 px-5 py-2.5 backdrop-blur-md bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-sm font-semibold mb-8 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Analysis Complete</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: easing }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            You Could Save
          </motion.h1>

          {/* MASSIVE savings number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: easing }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 blur-3xl opacity-30"></div>
            <div className="relative glass-card p-8 sm:p-12 glow-red-strong">
              <AnimatedCounter
                target={69000}
                prefix="€"
                duration={2500}
                className="text-7xl sm:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"
              />
              <p className="text-xl sm:text-2xl text-gray-400 mt-4">over 20 years</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-2xl sm:text-3xl text-gray-300 mb-4"
          >
            That's <span className="text-amber-400 font-bold">€287.50/month</span> average income
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            With a 15 kWp system - the maximum for Malta three-phase installations
          </motion.p>
        </div>
      </section>

      {/* ROI Cards Grid */}
      <section className="relative py-16 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { label: 'Monthly Income', value: 287.5, suffix: '/mo', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
              { label: 'Yearly Income', value: 3450, suffix: '/yr', icon: Calendar, color: 'from-amber-500 to-yellow-500' },
              { label: 'System Size', value: 15, suffix: ' kWp', icon: Zap, color: 'from-red-500 to-orange-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: easing }}
                whileHover={{ scale: 1.02 }}
                className="group relative glass-card p-8 hover:shadow-glow transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg glow-amber`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.label}</h3>
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.label.includes('Size') ? '' : '€'}
                  suffix={stat.suffix}
                  duration={2000}
                  className="text-4xl sm:text-5xl font-bold text-white"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cumulative Savings Chart - Money Growing! */}
      <section className="relative py-16 bg-gradient-to-b from-[#1a1a1a] to-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easing }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Watch Your Savings Grow
            </h2>
            <p className="text-xl text-gray-400">
              Your income accumulates month after month - <span className="text-green-400 font-bold">€3,450 in Year 1</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easing }}
            className="glass-card p-8 glow-amber"
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={cumulativeSavingsData}>
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => `€${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #10b981', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`€${value}`, 'Total Saved']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  fill="url(#cumulativeGradient)"
                  strokeWidth={4}
                  name="Total Savings"
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold text-lg">Year 1 Total: €3,450 income!</span>
              </div>
              <p className="text-gray-400 text-sm mt-4">Based on 15 kWp system with seasonal production variation</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Payback Timeline */}
      <section className="relative py-16 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easing }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Your Investment Timeline
            </h2>
            <p className="text-xl text-gray-400">
              Break even in <span className="text-green-400 font-bold">under 2 years</span> - then it's pure profit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easing }}
            className="glass-card p-8 glow-amber"
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={paybackTimeline}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="year" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fill="url(#profitGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-2">After 20 years:</p>
              <p className="text-3xl font-bold text-green-400">€64,000 in total profit!</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Property Details (Mini Section) */}
      <section className="relative py-12 bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'System Size', value: '15 kWp' },
              { label: 'Panels Needed', value: '19 × 800W' },
              { label: 'Annual Production', value: '23 MWh' },
              { label: 'Sun Hours/Year', value: '2,850 hrs' },
            ].map((detail, index) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="glass-card p-4 text-center"
              >
                <p className="text-gray-500 text-xs mb-1">{detail.label}</p>
                <p className="text-white font-bold text-lg">{detail.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency CTA */}
      <section className="relative py-20 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easing }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 backdrop-blur-md bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-sm font-semibold mb-8">
              <TrendingUp className="w-4 h-4" />
              <span>Electricity prices rising 8% per year</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Lock In These Savings Today
            </h2>

            <p className="text-xl text-gray-400 mb-8">
              Join 500+ Malta homeowners earning with 15 kWp systems - €287.50/month average
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <MagneticButton
                href="#contact"
                variant="primary"
              >
                Get Your Custom Quote
              </MagneticButton>

              <MagneticButton
                href="tel:+35679055156"
                variant="secondary"
              >
                Schedule Free Consultation
              </MagneticButton>
            </div>

            <p className="text-sm text-gray-500 mt-8">
              ✓ No obligation • ✓ Free site assessment • ✓ Custom installation plan
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
