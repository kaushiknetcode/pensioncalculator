// src/components/pension/ResultsTable.jsx
import React from 'react';

const ResultsTable = ({ results, timeline }) => {
  if (!results || !timeline || timeline.length === 0) return null;
  
  const fitmentFactor = 2.0; // For reference in the table
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Yearly Salary & Corpus Progression</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Pay</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DA %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPS Corpus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeline
              .filter((_, i) => i % 12 === 0) // Show yearly entries
              .map((entry, index) => {
                // Check if this is a CPC year
                const cpcEvent = results.cpcEvents.find(e => e.year === entry.year);
                const rowClass = cpcEvent ? 'bg-yellow-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                
                return (
                  <tr key={index} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{entry.basic.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.daPercent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{entry.grossSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{entry.npsCorpus.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cpcEvent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          CPC Applied (×{fitmentFactor})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      
      {/* CPC Events Summary */}
      {results.cpcEvents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">CPC Pay Revisions</h4>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2 mb-2">
              <div>Year</div>
              <div>Pre-CPC Basic</div>
              <div>Post-CPC Basic</div>
            </div>
            {results.cpcEvents.map((event, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 text-sm py-1">
                <div>{event.year}</div>
                <div>₹{event.oldBasic.toLocaleString()}</div>
                <div>₹{event.newBasic.toLocaleString()}</div>
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-500">
              Note: Each CPC applies a {fitmentFactor}× multiplier to basic pay and resets DA to 0%.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;