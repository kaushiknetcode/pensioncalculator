// src/components/pension/utils/npsCalculations.js

export const calculateNPSBenefits = (npsCorpus) => {
  const finalNPSCorpus = Math.round(npsCorpus);
  const lumpSum = Math.round(finalNPSCorpus * 0.6); // 60% withdrawal
  const annuityCorpus = Math.round(finalNPSCorpus * 0.4); // 40% for annuity
  const annuityRate = 6.5; // Annual rate of return on annuity
  const monthlyPension = Math.round((annuityCorpus * (annuityRate / 100)) / 12); // Monthly pension
  
  return {
    corpus: finalNPSCorpus,
    lumpSum,
    annuityCorpus,
    monthlyPension,
    annuityRate
  };
};