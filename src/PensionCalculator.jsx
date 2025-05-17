// src/PensionCalculator.jsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const PensionCalculator = () => {
  // Core state
  const [formData, setFormData] = useState({
    payLevel: '',
    currentBasic: '',
    currentDA: '50',
    incrementMonth: 'Jan',
    dateOfJoining: '',
    retirementDate: '',
    currentNPSCorpus: ''
  });

  // State for pay matrix and promotions
  const [payMatrix, setPayMatrix] = useState({});
  const [basicPayOptions, setBasicPayOptions] = useState([]);
  const [promotions, setPromotions] = useState([]);

  // Effect to load and process the pay matrix
  useEffect(() => {
    const loadPayMatrix = async () => {
      try {
        const response = await window.fs.readFile('/cpc.xlsx');
        const workbook = XLSX.read(response, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // Process into structured format
        const matrix = {};
        for (let i = 1; i <= 18; i++) {
          matrix[i] = {};
          for (let j = 1; j <= 40; j++) {
            const value = data[j - 1]?.[`Pay Level ${i}`];
            if (value) matrix[i][j] = value;
          }
        }
        setPayMatrix(matrix);
      } catch (error) {
        console.error("Error loading pay matrix:", error);
      }
    };
    loadPayMatrix();
  }, []);

  // Update basic pay options when level changes
  useEffect(() => {
    if (formData.payLevel && payMatrix[formData.payLevel]) {
      const options = Object.values(payMatrix[formData.payLevel])
        .filter(Boolean)
        .sort((a, b) => a - b);
      setBasicPayOptions(options);
    }
  }, [formData.payLevel, payMatrix]);

  // Handle adding a promotion
  const addPromotion = () => {
    const newPromotion = {
      id: Date.now(),
      date: '',
      newLevel: '',
      newBasic: '',
      validBasics: []
    };
    setPromotions([...promotions, newPromotion]);
  };

  // Handle updating a promotion
  const updatePromotion = (id, field, value) => {
    setPromotions(promotions.map(p => {
      if (p.id !== id) return p;

      const updatedPromotion = { ...p, [field]: value };

      // If level changed, update valid basic pay options
      if (field === 'newLevel' && value && payMatrix[value]) {
        const currentBasic = parseFloat(formData.currentBasic);
        const minRequired = currentBasic * 1.03; // Pay protection rule
        updatedPromotion.validBasics = Object.values(payMatrix[value])
          .filter(basic => basic >= minRequired)
          .sort((a, b) => a - b);
        updatedPromotion.newBasic = ''; // Reset basic when level changes
      }

      return updatedPromotion;
    }));
  };

  // Handle removing a promotion
  const removePromotion = (id) => {
    setPromotions(promotions.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Government Pension Calculator (NPS vs UPS)</h1>

      {/* Basic Information Section */}
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

      {/* Promotions Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Future Promotions</h2>
          <button
            onClick={addPromotion}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <PlusCircle size={20} />
            Add Promotion
          </button>
        </div>

        {promotions.map((promotion) => (
          <div key={promotion.id} className="border p-4 rounded mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Promotion Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Promotion Date</label>
                <input
                  type="date"
                  value={promotion.date}
                  onChange={(e) => updatePromotion(promotion.id, 'date', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* New Level */}
              <div>
                <label className="block text-sm font-medium mb-1">New Level</label>
                <select
                  value={promotion.newLevel}
                  onChange={(e) => updatePromotion(promotion.id, 'newLevel', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Level</option>
                  {[...Array(18)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                  ))}
                </select>
              </div>

              {/* New Basic Pay */}
              <div>
                <label className="block text-sm font-medium mb-1">New Basic Pay</label>
                <select
                  value={promotion.newBasic}
                  onChange={(e) => updatePromotion(promotion.id, 'newBasic', e.target.value)}
                  className="w-full p-2 border rounded"
                  disabled={!promotion.newLevel}
                >
                  <option value="">Select Basic Pay</option>
                  {promotion.validBasics?.map((basic) => (
                    <option key={basic} value={basic}>₹{Number(basic).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              {/* Remove Button */}
              <div className="flex items-end">
                <button
                  onClick={() => removePromotion(promotion.id)}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculate Button */}
      <button
        onClick={() => {
          // Calculation logic will be implemented
          console.log("Calculating benefits...", { formData, promotions });
        }}
        className="w-full bg-green-500 text-white px-6 py-3 rounded text-lg font-semibold hover:bg-green-600"
      >
        Calculate Pension Benefits
      </button>
    </div>
  );
};

export default PensionCalculator;