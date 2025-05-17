// src/components/pension/ResultsCharts.jsx
import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultsCharts = ({ results, timeline }) => {
  if (!results || !timeline || timeline.length === 0) return null;

  // Filter to yearly data points for clarity
  const yearlyData = timeline.filter((_, i) => i % 12 === 0);
  
  return (
    <div className="space-y-6">
      {/* Salary Growth Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Salary Growth Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={yearlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getFullYear()} />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="basic" name="Basic Pay" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="grossSalary" name="Gross Salary" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* NPS Corpus Growth Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-3">NPS Corpus Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={yearlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getFullYear()} />
              <YAxis tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="npsCorpus" 
                name="NPS Corpus" 
                stroke="#6366F1" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Pension Comparison Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Pension Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { 
                  name: 'Monthly Pension (Initial)', 
                  NPS: results.nps.monthlyPension, 
                  UPS: results.ups.monthlyPension 
                },
                { 
                  name: 'Lump Sum Benefit', 
                  NPS: results.nps.lumpSum, 
                  UPS: results.ups.gratuity 
                },
                { 
                  name: '20-Year Value', 
                  NPS: results.npsTotalValue, 
                  UPS: results.upsTotalValue 
                }
              ]}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => {
                if (value >= 10000000) return `₹${(value/10000000).toFixed(1)}Cr`;
                if (value >= 100000) return `₹${(value/100000).toFixed(1)}L`;
                return `₹${(value/1000).toFixed(0)}k`;
              }} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="NPS" name="NPS Benefits" fill="#3B82F6" />
              <Bar dataKey="UPS" name="UPS Benefits" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Show UPS Pension Growth only if eligible */}
      {results.isUPSEligible && (
        <div>
          <h3 className="text-lg font-semibold mb-3">UPS Pension Growth with DA</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={yearlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="upsPension" 
                  name="UPS Pension with DA Growth" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="npsPension" 
                  name="NPS Fixed Pension" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-500 text-center">
            Shows how UPS pension increases over time with DA adjustments, while NPS pension remains fixed
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsCharts;