// src/components/pension/ResultsSummary.jsx
import React from 'react';

const ResultsSummary = ({ results }) => {
  if (!results) return null;
  
  return (
    <>
      {/* Eligibility Warning */}
      {!results.isUPSEligible && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded">
          <p className="font-semibold">⚠️ Note: UPS Eligibility</p>
          <p>You need at least 10 years of service to qualify for UPS. Based on your inputs, your service period is {results.serviceYears} years.</p>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* NPS Results */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">New Pension Scheme (NPS)</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Final Corpus:</span>
              <span className="font-medium">₹{results.nps.corpus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Lump Sum (60%):</span>
              <span className="font-medium">₹{results.nps.lumpSum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Annuity Value (40%):</span>
              <span className="font-medium">₹{results.nps.annuityCorpus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Annuity Rate:</span>
              <span className="font-medium">{results.nps.annuityRate}% per annum</span>
            </div>
            <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t border-blue-200">
              <span>Monthly Pension:</span>
              <span className="text-blue-700">₹{results.nps.monthlyPension.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* UPS Results */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-3">Unique Pension Scheme (UPS)</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Average Emoluments (Last 10 months):</span>
              <span className="font-medium">₹{results.ups.avgBasic.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Gratuity Amount:</span>
              <span className="font-medium">₹{results.ups.gratuity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Period:</span>
              <span className="font-medium">{results.serviceYears} years ({results.completedHalfYears} half-years)</span>
            </div>
            <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t border-green-200">
              <span>Initial Monthly Pension:</span>
              <span className="text-green-700">₹{results.ups.monthlyPension.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Average Pension (with DA growth):</span>
              <span>₹{results.ups.avgPensionWith20YearDA.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comparison Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Comparison Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded shadow">
            <div className="text-gray-600 mb-1">Years of Service</div>
            <div className="text-2xl font-bold">{results.serviceYears}</div>
          </div>
          <div className="text-center p-3 bg-white rounded shadow">
            <div className="text-gray-600 mb-1">Retirement Basic Pay</div>
            <div className="text-2xl font-bold">₹{results.retirementBasic.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-white rounded shadow">
            <div className="text-gray-600 mb-1">Final DA%</div>
            <div className="text-2xl font-bold">{results.finalDA}%</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded shadow">
            <div className="text-gray-600 mb-1">NPS Monthly Pension</div>
            <div className="text-2xl font-bold text-blue-600">₹{results.nps.monthlyPension.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-white rounded shadow">
            <div className="text-gray-600 mb-1">UPS Monthly Pension (Initial)</div>
            <div className="text-2xl font-bold text-green-600">₹{results.ups.monthlyPension.toLocaleString()}</div>
            <div className="text-sm text-green-500">Grows with DA increases</div>
          </div>
        </div>
        
        <div className="mt-4 text-center p-4 bg-white rounded shadow">
          <div className="text-gray-600 mb-1">Difference in 20-Year Value</div>
          <div className={`text-3xl font-bold ${results.differenceValue >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
            {results.differenceValue >= 0 ? 'NPS is higher by ' : 'UPS is higher by '}
            ₹{Math.abs(results.differenceValue).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Assuming 20 years of pension benefits after retirement
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsSummary;