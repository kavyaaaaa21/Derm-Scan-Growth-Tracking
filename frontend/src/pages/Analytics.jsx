import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { BarChart2, TrendingUp, Users, AlertTriangle,
         ShieldCheck, Activity, RefreshCw } from 'lucide-react'

const TEAL  = '#00D9C0'
const RED   = '#FF4C6A'
const AMBER = '#FFB347'
const GREEN = '#3DDC84'
const MUTED = '#6B8CAE'

function StatCard({ icon: Icon, label, value, color = 'teal', sub }) {
  const clr = { teal:'text-ds-teal bg-ds-teal/15 border-ds-teal/30',
                red:'text-ds-red bg-ds-red/15 border-ds-red/30',
                green:'text-ds-green bg-ds-green/15 border-ds-green/30',
                amber:'text-ds-amber bg-ds-amber/15 border-ds-amber/30' }[color]
  const tc  = clr.split(' ')[0]
  return (
    <div className="ds-card p-5">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${clr}`}>
        <Icon size={18} className={tc} />
      </div>
      <p className={`font-display font-bold text-3xl ${tc} leading-none`}>{value}</p>
      <p className="text-ds-text text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-ds-muted text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ds-card border border-ds-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-ds-muted mb-1.5 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = async () => {
    setLoading(true); setError(null)
    try {
      const { data: d } = await axios.get('http://localhost:8000/analytics')
      setData(d)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load analytics. Are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 text-ds-teal text-xs font-mono uppercase tracking-widest mb-3">
            <BarChart2 size={12} /> Analytics Dashboard
          </div>
          <h1 className="section-title">Statistics Overview</h1>
          <p className="section-sub">Aggregate analysis across all your patients and visits.</p>
        </div>
        <button onClick={fetch} disabled={loading}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-ds-red/10 border border-ds-red/25 text-ds-red text-sm mb-8">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Activity} label="Total Scans"      value={data.total_scans}
                      color="teal" sub={`${data.total_patients} patients`} />
            <StatCard icon={AlertTriangle} label="Malignant Flags" value={data.malignant_count}
                      color="red" sub={`${Math.round(data.malignancy_rate*100)}% rate`} />
            <StatCard icon={ShieldCheck} label="Benign"         value={data.benign_count}
                      color="green" sub={`${Math.round((1-data.malignancy_rate)*100)}%`} />
            <StatCard icon={TrendingUp} label="High-Risk Alerts" value={data.alert_count}
                      color="amber" sub={`${data.high_risk_count} high-risk visits`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Risk distribution pie */}
            <div className="ds-card p-5">
              <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">Risk Levels</p>
              <p className="font-display font-semibold text-ds-text mb-4">Change Risk Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={[
                    { name:'Low',    value: data.risk_distribution.LOW    || 0 },
                    { name:'Medium', value: data.risk_distribution.MEDIUM || 0 },
                    { name:'High',   value: data.risk_distribution.HIGH   || 0 },
                  ]} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    paddingAngle={3} dataKey="value">
                    <Cell fill={GREEN} />
                    <Cell fill={AMBER} />
                    <Cell fill={RED}   />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span style={{color:MUTED,fontSize:11}}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ABCDE distribution bar */}
            <div className="ds-card p-5">
              <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">ABCDE</p>
              <p className="font-display font-semibold text-ds-text mb-4">Score Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.abcde_distribution} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2E4A" vertical={false} />
                  <XAxis dataKey="score" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={TEAL} radius={[4,4,0,0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Confidence stat */}
            <div className="ds-card p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">Confidence</p>
                <p className="font-display font-semibold text-ds-text mb-4">Avg Model Confidence</p>
                <p className="font-display font-extrabold text-5xl text-ds-teal">
                  {Math.round(data.avg_confidence * 100)}<span className="text-2xl">%</span>
                </p>
                <p className="text-ds-muted text-sm mt-2">across {data.total_scans} scans</p>
              </div>
              <div className="conf-bar-track mt-4">
                <div className="conf-bar-fill" style={{ width: `${Math.round(data.avg_confidence*100)}%` }} />
              </div>
            </div>
          </div>

          {/* Monthly trend */}
          {data.prediction_by_month.length > 0 && (
            <div className="ds-card p-5 mb-6">
              <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">Timeline</p>
              <p className="font-display font-semibold text-ds-text mb-4">Monthly Scan Volume</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.prediction_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2E4A" vertical={false} />
                  <XAxis dataKey="month" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span style={{color:MUTED,fontSize:11}}>{v}</span>} />
                  <Line type="monotone" dataKey="total" stroke={TEAL}
                        strokeWidth={2} dot={{ fill:TEAL, r:3 }} name="Total" />
                  <Line type="monotone" dataKey="malignant" stroke={RED}
                        strokeWidth={2} dot={{ fill:RED, r:3 }} name="Malignant flags" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Body locations */}
          {data.top_body_locations.length > 0 && (
            <div className="ds-card p-5">
              <p className="text-xs text-ds-muted font-mono uppercase tracking-widest mb-1">
                Locations
              </p>
              <p className="font-display font-semibold text-ds-text mb-4">Top Lesion Sites</p>
              <div className="space-y-2.5">
                {data.top_body_locations.map(({ location, count }) => {
                  const maxCount = data.top_body_locations[0]?.count || 1
                  return (
                    <div key={location}>
                      <div className="flex justify-between text-xs text-ds-muted mb-1">
                        <span className="capitalize">{location.replace(/_/g,' ')}</span>
                        <span className="font-mono">{count}</span>
                      </div>
                      <div className="conf-bar-track">
                        <div className="conf-bar-fill" style={{ width: `${(count/maxCount)*100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.total_scans === 0 && (
            <div className="ds-card p-12 text-center text-ds-muted">
              <BarChart2 size={36} className="text-ds-teal/30 mx-auto mb-3" />
              <p className="font-medium text-ds-text mb-1">No data yet</p>
              <p className="text-sm">Add patient visits in the Tracker to see analytics here.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}