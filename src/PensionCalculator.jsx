// src/PensionCalculator.jsx - Part 1: State and Initial Setup

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, Trash2, Calculator } from 'lucide-react';
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
  
  // State for calculation results
  const [results, setResults] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to load and process the pay matrix
  useEffect(() => {
    const loadPayMatrix = async () => {
      try {
        setLoading(true);
        // Mock pay matrix for testing
        const mockMatrix = generateMockPayMatrix();
        setPayMatrix(mockMatrix);
        setLoading(false);
      } catch (error) {
        console.error("Error loading pay matrix:", error);
        setError("Failed to load pay matrix. Please try again later.");
        setLoading(false);
      }
    };
    
    loadPayMatrix();
  }, []);

  // Generate a mock pay matrix for testing
  const generateMockPayMatrix = () => {
    const matrix = {};
    
    // Level 1 (18000 to 56900)
    matrix[1] = {};
    let value = 18000;
    for (let i = 1; i <= 40; i++) {
      matrix[1][i] = value;
      value = Math.round(value * 1.03); // 3% increment
    }
    
    // Level 2 (19900 to 63200)
    matrix[2] = {};
    value = 19900;
    for (let i = 1; i <= 40; i++) {
      matrix[2][i] = value;
      value = Math.round(value * 1.03);
    }
    
    // Level 3 (21700 to 69100)
    matrix[3] = {};
    value = 21700;
    for (let i = 1; i <= 40; i++) {
      matrix[3][i] = value;
      value = Math.round(value * 1.03);
    }
    
    // Higher levels
    const basePays = [
      25500, 29200, 35400, 44900, 47600, 53100, 
      56100, 67700, 78800, 118500, 123100, 131100, 
      144200, 182200, 205400, 225000, 250000
    ];
    
    for (let level = 4; level <= 18; level++) {
      matrix[level] = {};
      value = basePays[level - 4];
      for (let i = 1; i <= 40; i++) {
        matrix[level][i] = value;
        value = Math.round(value * 1.03);
      }
    }
    
    return matrix;
  };

  // Update basic pay options when level changes
  useEffect(() => {
    if (formData.payLevel && payMatrix[formData.payLevel]) {
      const options = Object.values(payMatrix[formData.payLevel])
        .filter(Boolean)
        .sort((a, b) => a - b);
      
      setBasicPayOptions(options);
    }
  }, [formData.payLevel, payMatrix]);

  // Find index in pay matrix for a specific basic pay
  const findIndexForBasic = (level, basic) => {
    if (!payMatrix[level]) return 1;
    
    const entries = Object.entries(payMatrix[level]);
    for (const [index, value] of entries) {
      if (value === basic) return parseInt(index);
    }
    
    // Default to 1 if not found
    return 1;
  };

  // Get next basic pay based on level and index
  const getNextBasicPay = (level, index) => {
    if (!payMatrix[level]) return null;
    
    // If we've reached the max index, stay at that pay
    if (index > 40) return payMatrix[level][40];
    
    return payMatrix[level][index] || payMatrix[level][40]; // Fallback to max if not found
  };

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

      // If level changed, update valid basic pay options with pay protection
      if (field === 'newLevel' && value && payMatrix[value]) {
        const currentBasic = parseFloat(formData.currentBasic) || 0;
        const minRequired = currentBasic * 1.03; // Pay protection rule - FIX 6
        updatedPromotion.validBasics = Object.values(payMatrix[value])
          .filter(basic => basic >= minRequired) // Only show valid options
          .sort((a, b) => a - b);
        updatedPromotion.newBasic = updatedPromotion.validBasics[0] || ''; // Set to first valid option
      }

      return updatedPromotion;
    }));
  };

  // Handle removing a promotion
  const removePromotion = (id) => {
    setPromotions(promotions.filter(p => p.id !== id));
  };

  // Core calculation function
  const calculatePension = () => {
    setError('');
    setResults(null);
    
    // Validate inputs
    if (!formData.payLevel || !formData.currentBasic || !formData.dateOfJoining || !formData.retirementDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Parse input data
      const currentLevel = parseInt(formData.payLevel);
      const currentBasic = parseInt(formData.currentBasic);
      const currentDA = parseFloat(formData.currentDA) / 100; // Convert to decimal
      const incrementMonth = formData.incrementMonth;
      const joiningDate = new Date(formData.dateOfJoining);
      const retirementDate = new Date(formData.retirementDate);
      const initialNPSCorpus = parseFloat(formData.currentNPSCorpus) || 0;
      
      // Validate dates
      if (retirementDate <= joiningDate) {
        setError('Retirement date must be after joining date');
        setLoading(false);
        return;
      }
      
      // Calculate service period - FIX 11
      const totalMonthsOfService = Math.round((retirementDate - joiningDate) / (30 * 24 * 60 * 60 * 1000));
      const completedHalfYears = Math.floor(totalMonthsOfService / 6); // FIX 3
      const totalServiceYears = totalMonthsOfService / 12;
      
      // Check UPS eligibility (minimum 10 years)
      const isUPSEligible = totalServiceYears >= 10;
      
      // Sort promotions by date
      const sortedPromotions = [...promotions]
        .filter(p => p.date && p.newLevel && p.newBasic)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Initialize timeline
      let timelineData = [];
      
      // Set starting values FROM DATE OF JOINING (FIX 11)
      let currentDate = new Date(joiningDate);
      let currentMonth = currentDate.getMonth();
      let currentYear = currentDate.getFullYear();
      let level = currentLevel;
      let basic = currentBasic;
      let index = findIndexForBasic(level, basic);
      let da = currentDA; // Start with current DA
      let npsCorpus = initialNPSCorpus;
      
      // Check next CPC year
      let nextCPCYear = Math.ceil(currentYear / 10) * 10 + 6; // 2026, 2036, etc.

      // Simulate month by month until retirement
      while (new Date(currentYear, currentMonth) <= retirementDate) {
        // Check for promotions - FIX 9
        const duePromotion = sortedPromotions.find(p => {
          const promotionDate = new Date(p.date);
          return promotionDate.getFullYear() === currentYear && 
                 promotionDate.getMonth() === currentMonth;
        });
        
        if (duePromotion) {
          level = parseInt(duePromotion.newLevel);
          basic = parseInt(duePromotion.newBasic);
          index = findIndexForBasic(level, basic);
          
          // Validate pay protection rule (new basic >= current basic * 1.03) - FIX 6
          if (basic < currentBasic * 1.03) {
            setError(`Promotion violates pay protection rule. New basic must be at least ₹${Math.ceil(currentBasic * 1.03)}`);
            setLoading(false);
            return;
          }
        }
        
        // Check for CPC implementation (January of CPC year) - FIX 8
        if (currentMonth === 0 && currentYear === nextCPCYear) {
          basic = Math.round(basic * 2); // Fitment factor of 2.0
          da = 0; // DA resets to 0% after CPC
          // Calculate next CPC year
          nextCPCYear += 10;
        }
        
        // Check for annual increment (Jan or Jul based on user input)
        if ((incrementMonth === 'Jan' && currentMonth === 0) || 
            (incrementMonth === 'Jul' && currentMonth === 6)) {
          // Increment by moving to next index, but don't exceed 40 - FIX 7
          if (index < 40) {
            index++;
          }
          basic = getNextBasicPay(level, index);
        }
        
        // Check for DA change (Jan and Jul) - FIX 1
        if (currentMonth === 0 || currentMonth === 6) {
          // Increase DA by 3 percentage points
          da += 0.03;
        }
        
        // Calculate monthly values
        const daAmount = Math.round(basic * da);
        const grossSalary = basic + daAmount;
        
        // Calculate NPS contribution (10% employee + 14% government) - FIX 4
        const npsContribution = grossSalary * 0.24;
        
        // Grow NPS corpus with monthly contribution and 8% annual return (compounded monthly)
        // First add the contribution, then apply the interest - FIX 4
        const monthlyInterestRate = 0.08 / 12; // Monthly equivalent of 8% annual
        npsCorpus += npsContribution;
        npsCorpus *= (1 + monthlyInterestRate);
        
        // Add to timeline
        timelineData.push({
          date: new Date(currentYear, currentMonth).toISOString().slice(0, 7),
          year: currentYear,
          month: currentMonth,
          level,
          index,
          basic,
          daPercent: Math.round(da * 100),
          daAmount,
          grossSalary,
          npsContribution,
          npsCorpus: Math.round(npsCorpus)
        });
        
        // Move to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }

      // Calculate NPS benefits - FIX 5
      const finalNPSCorpus = Math.round(npsCorpus);
      const npsLumpSum = Math.round(finalNPSCorpus * 0.6); // 60% withdrawal
      const npsAnnuityCorpus = Math.round(finalNPSCorpus * 0.4); // 40% for annuity
      const annuityRate = 6.5; // Annual rate of return on annuity
      const npsMonthlyPension = Math.round((npsAnnuityCorpus * (annuityRate / 100)) / 12); // Monthly pension
      
      // Calculate UPS benefits (based on last 10 months' average) - FIX 2
      const lastTenMonths = timelineData.slice(-10);
      
      // Include DA in calculation - FIX 2
      const avgEmoluments = lastTenMonths.reduce((sum, month) => 
        sum + (month.basic * (1 + (month.daPercent / 100))), 0) / lastTenMonths.length;
      
      const upsMonthlyPension = isUPSEligible ? Math.round(avgEmoluments * 0.5) : 0; // 50% of average emoluments
      
      // Correct gratuity calculation - FIX 3
      const lastSalary = timelineData[timelineData.length - 1];
      const gratuityBase = lastSalary.basic * (1 + (lastSalary.daPercent / 100));
      let upsGratuity = Math.round(gratuityBase * 0.10 * completedHalfYears);
      // Add cap to gratuity as per rules (typically ₹20L)
      upsGratuity = Math.min(upsGratuity, 2000000);
      
      // Calculate UPS pension growth with DA for 20 years post-retirement - FIX 10
      const upsPensionGrowth = [];
      let currentUPSPension = upsMonthlyPension;
      let postRetirementDA = lastSalary.daPercent / 100;
      
      // Simulate 20 years of DA growth on UPS pension
      for (let year = 0; year < 20; year++) {
        // Add DA increases twice a year (Jan and Jul)
        postRetirementDA += 0.03; // January
        let janPension = Math.round(upsMonthlyPension * (1 + postRetirementDA));
        
        upsPensionGrowth.push({
          year: lastSalary.year + year,
          month: 0, // January
          pension: janPension
        });
        
        postRetirementDA += 0.03; // July
        let julPension = Math.round(upsMonthlyPension * (1 + postRetirementDA));
        
        upsPensionGrowth.push({
          year: lastSalary.year + year,
          month: 6, // July
          pension: julPension
        });
      }
      
      // Get average UPS pension over 20 years
      const avgUPSPension = upsPensionGrowth.reduce((sum, entry) => sum + entry.pension, 0) / upsPensionGrowth.length;
      
      // Calculate summary metrics
      const npsTotalValue = npsLumpSum + (npsMonthlyPension * 12 * 20); // Assuming 20 years of pension
      const upsTotalValue = upsGratuity + (avgUPSPension * 12 * 20); // Using average pension for 20 years
      
      // Prepare results
      const calculationResults = {
        nps: {
          corpus: finalNPSCorpus,
          lumpSum: npsLumpSum,
          annuityCorpus: npsAnnuityCorpus,
          monthlyPension: npsMonthlyPension,
          totalValue: npsTotalValue
        },
        ups: {
          avgBasic: Math.round(avgEmoluments),
          monthlyPension: upsMonthlyPension,
          gratuity: upsGratuity,
          avgPensionWith20YearDA: Math.round(avgUPSPension),
          totalValue: upsTotalValue,
          pensionGrowth: upsPensionGrowth
        },
        serviceYears: Math.round(totalServiceYears),
        completedHalfYears: completedHalfYears,
        retirementBasic: lastSalary.basic,
        finalDA: lastSalary.daPercent,
        differenceValue: npsTotalValue - upsTotalValue,
        isUPSEligible
      };
      
      setTimeline(timelineData);
      setResults(calculationResults);
      setLoading(false);
    } catch (error) {
      console.error("Calculation error:", error);
      setError("An error occurred during calculation. Please check your inputs and try again.");
      setLoading(false);
    }
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
        onClick={calculatePension}
        disabled={loading}
        className="w-full bg-green-500 text-white px-6 py-3 rounded text-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⌛</span>
            Calculating...
          </>
        ) : (
          <>
            <Calculator size={20} />
            Calculate Pension Benefits
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Calculation Results</h2>
            
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
                    <span className="font-medium">6.5% per annum</span>
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
            
            {/* Visualizations */}
            <div className="space-y-6">
              {/* Salary Growth Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Salary Growth Over Time</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeline.filter((_, i) => i % 12 === 0)} // Yearly data points for clarity
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
                      data={timeline.filter((_, i) => i % 12 === 0)} // Yearly data points
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
                        { name: 'Monthly Pension (Initial)', NPS: results.nps.monthlyPension, UPS: results.ups.monthlyPension },
                        { name: 'Lump Sum Benefit', NPS: results.nps.lumpSum, UPS: results.ups.gratuity },
                        { name: '20-Year Value', NPS: results.nps.totalValue, UPS: results.ups.totalValue }
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

              {/* UPS Pension Growth Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-3">UPS Pension Growth with DA</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={results.ups.pensionGrowth.filter((_, i) => i % 2 === 0)} // Show yearly points for clarity
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pension" 
                        name="UPS Pension with DA Growth" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fixed" 
                        name="NPS Fixed Pension" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        data={results.ups.pensionGrowth.filter((_, i) => i % 2 === 0).map(() => ({ fixed: results.nps.monthlyPension }))}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Shows how UPS pension increases over time with DA adjustments, while NPS pension remains fixed
                </div>
              </div>
            </div>

            {/* Yearly Data Table */}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeline
                      .filter((_, i) => i % 12 === 0) // Show yearly entries
                      .map((entry, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">{entry.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{entry.basic.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{entry.daPercent}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{entry.grossSalary.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{entry.npsCorpus.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PensionCalculator;