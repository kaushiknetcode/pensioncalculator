import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { generateMockPayMatrix } from './utils/payMatrixUtils';
import { calculatePension } from './utils/calculatePension';
import PensionForm from './PensionForm';
import PromotionsSection from './PromotionsSection';
import ResultsSummary from './ResultsSummary';
import ResultsCharts from './ResultsCharts';
import ResultsTable from './ResultsTable';

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

  // Update basic pay options when level changes
  useEffect(() => {
    if (formData.payLevel && payMatrix[formData.payLevel]) {
      const options = Object.values(payMatrix[formData.payLevel])
        .filter(Boolean)
        .sort((a, b) => a - b);
      
      setBasicPayOptions(options);
    }
  }, [formData.payLevel, payMatrix]);

  const handleCalculate = async () => {
    setError('');
    setResults(null);
    
    // Validate inputs
    if (!formData.payLevel || !formData.currentBasic || !formData.dateOfJoining || !formData.retirementDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // First, let's calculate everything
      const calculation = calculatePension(formData, promotions, payMatrix);
      
      if (calculation.error) {
        setError(calculation.error);
        setLoading(false);
        return;
      }

      // Update state with results
      setResults(calculation.results);
      setTimeline(calculation.timeline);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({
          top: document.querySelector('.mt-6')?.offsetTop || 0,
          behavior: 'smooth'
        });
      }, 100);

    } catch (error) {
      console.error("Calculation error:", error);
      setError("An error occurred during calculation. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Government Pension Calculator (NPS vs UPS)</h1>

      <PensionForm 
        formData={formData} 
        setFormData={setFormData} 
        basicPayOptions={basicPayOptions} 
      />

      <PromotionsSection 
        promotions={promotions}
        addPromotion={() => {
          const newPromotion = {
            id: Date.now(),
            date: '',
            newLevel: '',
            newBasic: '',
            validBasics: []
          };
          setPromotions([...promotions, newPromotion]);
        }}
        updatePromotion={(id, field, value) => {
          setPromotions(promotions.map(p => {
            if (p.id !== id) return p;

            const updatedPromotion = { ...p, [field]: value };

            // FIX 6: If level changed, update valid basic pay options with pay protection
            if (field === 'newLevel' && value && payMatrix[value]) {
              const currentBasic = parseFloat(formData.currentBasic) || 0;
              const minRequired = currentBasic * 1.03; // Pay protection rule
              updatedPromotion.validBasics = Object.values(payMatrix[value])
                .filter(basic => basic >= minRequired)
                .sort((a, b) => a - b);
              updatedPromotion.newBasic = updatedPromotion.validBasics[0] || '';
            }

            return updatedPromotion;
          }));
        }}
        removePromotion={(id) => setPromotions(promotions.filter(p => p.id !== id))}
      />

      <button
        onClick={handleCalculate}
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

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Calculation Results</h2>
            
            <ResultsSummary results={results} />
            <ResultsCharts results={results} timeline={timeline} />
            <ResultsTable results={results} timeline={timeline} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PensionCalculator;