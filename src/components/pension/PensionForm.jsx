// src/components/pension/PensionForm.jsx
import React from 'react';

const PensionForm = ({ formData, setFormData, basicPayOptions }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pay Level Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Pay Level</label>
          <select
            value={formData.payLevel}
            onChange={(e) => setFormData({...formData, payLevel: e.target.value, currentBasic: ''})}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Pay Level</option>
            {[...Array(18)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Level {i + 1}</option>
            ))}
          </select>
        </div>

        {/* Basic Pay Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Basic Pay</label>
          <select
            value={formData.currentBasic}
            onChange={(e) => setFormData({...formData, currentBasic: e.target.value})}
            className="w-full p-2 border rounded"
            disabled={!formData.payLevel}
          >
            <option value="">Select Basic Pay</option>
            {basicPayOptions.map((pay) => (
              <option key={pay} value={pay}>₹{Number(pay).toLocaleString()}</option>
            ))}
          </select>
        </div>

        {/* Current DA */}
        <div>
          <label className="block text-sm font-medium mb-1">Current DA%</label>
          <input
            type="number"
            value={formData.currentDA}
            onChange={(e) => setFormData({...formData, currentDA: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Enter current DA percentage"
          />
        </div>

        {/* Increment Month */}
        <div>
          <label className="block text-sm font-medium mb-1">Increment Month</label>
          <select
            value={formData.incrementMonth}
            onChange={(e) => setFormData({...formData, incrementMonth: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="Jan">January</option>
            <option value="Jul">July</option>
          </select>
        </div>

        {/* Date of Joining */}
        <div>
          <label className="block text-sm font-medium mb-1">Date of Joining</label>
          <input
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Retirement Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date of Retirement</label>
          <input
            type="date"
            value={formData.retirementDate}
            onChange={(e) => setFormData({...formData, retirementDate: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Current NPS Corpus */}
        <div>
          <label className="block text-sm font-medium mb-1">Current NPS Corpus (Optional)</label>
          <input
            type="number"
            value={formData.currentNPSCorpus}
            onChange={(e) => setFormData({...formData, currentNPSCorpus: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Enter current NPS corpus if any"
          />
        </div>
      </div>
    </div>
  );
};

export default PensionForm;