// src/components/pension/utils/upsCalculations.js

export const calculateUPSBenefits = (timeline, completedHalfYears, isUPSEligible, npsMonthlyPension) => {
  // Get last 10 months for UPS calculation
  const lastTenMonths = timeline.slice(-10);
  
  // Include DA in calculation - Calculate average emoluments (Basic + DA)
  const avgEmoluments = lastTenMonths.reduce((sum, month) => 
    sum + (month.basic * (1 + (month.daPercent / 100))), 0) / lastTenMonths.length;
  
  // Calculate monthly pension (50% of average emoluments)
  const monthlyPension = isUPSEligible ? Math.round(avgEmoluments * 0.5) : 0;
  
  // Calculate gratuity - (10% of last drawn basic+DA) × completed half-years, capped at ₹20L
  const lastSalary = timeline[timeline.length - 1];
  const gratuityBase = lastSalary.basic * (1 + (lastSalary.daPercent / 100));
  let gratuity = Math.round(gratuityBase * 0.10 * completedHalfYears);
  gratuity = Math.min(gratuity, 2000000); // Cap at ₹20L
  
  // Calculate UPS pension growth with DA for 20 years post-retirement
  const pensionGrowth = [];
  let postRetirementDA = lastSalary.daPercent / 100;
  
  // Simulate 20 years of DA growth on UPS pension
  for (let year = 0; year < 20; year++) {
    // Add DA increases twice a year (Jan and Jul)
    postRetirementDA += 0.03; // January
    let janPension = Math.round(monthlyPension * (1 + postRetirementDA));
    
    pensionGrowth.push({
      year: lastSalary.year + year,
      month: 0, // January
      pension: janPension,
      fixed: npsMonthlyPension // For comparison chart
    });
    
    postRetirementDA += 0.03; // July
    let julPension = Math.round(monthlyPension * (1 + postRetirementDA));
    
    pensionGrowth.push({
      year: lastSalary.year + year,
      month: 6, // July
      pension: julPension,
      fixed: npsMonthlyPension // For comparison chart
    });
  }
  
  // Calculate average UPS pension over 20 years
  const avgPensionWith20YearDA = pensionGrowth.reduce((sum, entry) => 
    sum + entry.pension, 0) / pensionGrowth.length;
  
  return {
    avgBasic: Math.round(avgEmoluments),
    monthlyPension,
    gratuity,
    pensionGrowth,
    avgPensionWith20YearDA: Math.round(avgPensionWith20YearDA)
  };
};