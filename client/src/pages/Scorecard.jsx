import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScore } from '../context/ScoreContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BookOpen } from 'lucide-react';

function ProgressBar({ percent, className = '' }) {
  const color =
    percent >= 70 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function CircularGauge({ percent }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 70 ? '#22c55e' : percent >= 40 ? '#eab308' : '#ef4444';

  return (
    <svg width="180" height="180" className="mx-auto">
      <circle
        cx="90" cy="90" r={radius}
        fill="none" stroke="#e5e7eb" strokeWidth="12"
      />
      <circle
        cx="90" cy="90" r={radius}
        fill="none" stroke={color} strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
        className="transition-all duration-700"
      />
      <text x="90" y="85" textAnchor="middle" className="text-3xl font-bold" fill={color}>
        {percent}%
      </text>
      <text x="90" y="105" textAnchor="middle" className="text-xs" fill="#6b7280">
        Health Score
      </text>
    </svg>
  );
}

export default function Scorecard() {
  const {
    categories,
    totalScore,
    healthPercent,
    completedSystems,
    totalSystems,
    scoreHistory,
    loading,
    fetchLearnData,
    fetchHistory,
  } = useScore();

  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (categories.length === 0) fetchLearnData();
  }, [categories.length, fetchLearnData]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const chartData = [...scoreHistory]
    .reverse()
    .map((h) => ({
      date: new Date(h.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      healthPercent: h.healthPercent,
      totalScore: h.totalScore,
    }));

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Scorecard</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'overview' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'history' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Progress History
        </button>
      </div>

      {tab === 'overview' && (
        <>
          {/* Gauge */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Business Health Score</h2>
            <CircularGauge percent={healthPercent} />
            <p className="text-lg font-bold text-gray-700 mt-2">
              {totalScore} / {totalSystems * 10} points
            </p>
            <p className="text-sm text-gray-500">
              {completedSystems} of {totalSystems} systems complete
            </p>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Category Breakdown</h2>
            <div className="space-y-4">
              {categories.map((cat) => {
                const completedInCat = cat.systems.filter((s) => s.isComplete).length;
                return (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/learn#category-${cat.name.replace(/\s+/g, '-')}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <span className="text-sm text-gray-500">
                        {cat.categoryPercent}% — {completedInCat}/{cat.systems.length} systems ✅
                      </span>
                    </div>
                    <ProgressBar percent={cat.categoryPercent} />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => navigate('/learn')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Go to Learn →
          </button>
        </>
      )}

      {tab === 'history' && (
        <>
          {/* Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Progress Trend</h2>
            {chartData.length < 2 ? (
              <p className="text-center text-gray-400 py-8">
                Complete more resources to see your progress trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'healthPercent'
                        ? [`${value}%`, 'Health %']
                        : [value, 'Score']
                    }
                    labelFormatter={(label) => label}
                  />
                  <Line
                    type="monotone"
                    dataKey="healthPercent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* History table */}
          {scoreHistory.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Score</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Health %</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreHistory.map((h, idx) => {
                      const prev = scoreHistory[idx + 1];
                      const change = prev
                        ? h.totalScore - prev.totalScore
                        : null;
                      return (
                        <tr key={h._id || idx} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">
                            {new Date(h.savedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2 text-gray-700">
                            {h.totalScore} / {totalSystems * 10}
                          </td>
                          <td className="py-2 text-gray-700">{h.healthPercent}%</td>
                          <td className="py-2">
                            {change !== null ? (
                              <span
                                className={
                                  change > 0
                                    ? 'text-green-600'
                                    : change < 0
                                    ? 'text-red-600'
                                    : 'text-gray-400'
                                }
                              >
                                {change > 0 ? `+${change} pts ↑` : change < 0 ? `${change} pts ↓` : '—'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
