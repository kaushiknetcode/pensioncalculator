// src/components/pension/utils/calculatePension.js
import { findIndexForBasic, getNextBasicPay } from './payMatrixUtils';
import { calculateNPSBenefits } from './npsCalculations';
import { calculateUPSBenefits } from './upsCalculations';

export const calculatePension = (
  formData, 
  promotions, 
  payMatrix, 
  setTimeline, 
  setError, 
  setLoading
) => {
  const timeline = [];
  let error = null;
  
  try {
    // Parse input data
    const currentLevel = parseInt(formData.payLevel);
    const currentBasic = parseInt(formData.currentBasic);
    const currentDA = parseFloat(formData.currentDA) / 100; // Convert to decimal
    const incrementMonth = formData.incrementMonth;
    const joiningDate = new Date(formData.dateOfJoining);
    const retirementDate = new Date(formData.retirementDate);
    const initialNPSCorpus = parseFloat(formData.currentNPSCorpus) || 0;
    const fitmentFactor = 2.0; // CPC Fitment Factor
    
    // Validate dates
    if (retirementDate <= joiningDate) {
      return { error: 'Retirement date must be after joining date' };
    }
    
    // Calculate service period
    const totalMonthsOfService = Math.round((retirementDate - joiningDate) / (30 * 24 * 60 * 60 * 1000));
    const completedHalfYears = Math.floor(totalMonthsOfService / 6);
    const totalServiceYears = totalMonthsOfService / 12;
    
    // Check UPS eligibility (minimum 10 years)
    const isUPSEligible = totalServiceYears >= 10;
    
    // Sort promotions by date
    const sortedPromotions = [...promotions]
      .filter(p => p.date && p.newLevel && p.newBasic)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Set starting values FROM DATE OF JOINING
    let currentDate = new Date(joiningDate);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let level = currentLevel;
    let basic = currentBasic;
    let index = findIndexForBasic(payMatrix, level, basic);
    let da = currentDA; // Start with current DA
    let npsCorpus = initialNPSCorpus;
    
    // Calculate next CPC year - Ensure we catch 2026, 2036, etc.
    let nextCPCYear = Math.floor(currentYear / 10) * 10 + 6;
    if (nextCPCYear <= currentYear) {
      nextCPCYear += 10; // Move to next decade if current year is past this decade's CPC
    }
    
    const cpcEvents = [];
    
    // Simulate month by month until retirement
    while (new Date(currentYear, currentMonth) <= retirementDate) {
      // Check for promotions
      const duePromotion = sortedPromotions.find(p => {
        const promotionDate = new Date(p.date);
        return promotionDate.getFullYear() === currentYear && 
               promotionDate.getMonth() === currentMonth;
      });
      
      if (duePromotion) {
        level = parseInt(duePromotion.newLevel);
        basic = parseInt(duePromotion.newBasic);
        index = findIndexForBasic(payMatrix, level, basic);
        
        // Validate pay protection rule (new basic >= current basic * 1.03)
        if (basic < currentBasic * 1.03) {
          return { error: `Promotion violates pay protection rule. New basic must be at least ₹${Math.ceil(currentBasic * 1.03)}` };
        }
      }
      
      // Check for CPC implementation (January of CPC year)
      if (currentMonth === 0 && currentYear === nextCPCYear) {
        // Keep a record of pre-CPC values for reporting
        const preCPCBasic = basic;
        
        // Apply fitment factor to basic pay
        basic = Math.round(basic * fitmentFactor);
        
        // Keep track of CPC events
        cpcEvents.push({
          year: currentYear,
          oldBasic: preCPCBasic,
          newBasic: basic,
          fitmentFactor
        });
        
        // Reset DA to 0% after CPC
        da = 0;
        
        // Calculate next CPC year
        nextCPCYear += 10;
      }
      
      // Check for annual increment (Jan or Jul based on user input)
      if ((incrementMonth === 'Jan' && currentMonth === 0) || 
          (incrementMonth === 'Jul' && currentMonth === 6)) {
        // Increment by moving to next index, but don't exceed 40
        if (index < 40) {
          index++;
        }
        basic = getNextBasicPay(payMatrix, level, index);
      }
      
      // Check for DA change (Jan and Jul) - Add 3 percentage points, not compound
      if (currentMonth === 0 || currentMonth === 6) {
        // Increase DA by 3 percentage points
        da += 0.03;
      }
      
      // Calculate monthly values
      const daAmount = Math.round(basic * da);
      const grossSalary = basic + daAmount;
      
      // Calculate NPS contribution (10% employee + 14% government)
      const npsContribution = grossSalary * 0.24;
      
      // Grow NPS corpus with monthly contribution and 8% annual return (compounded monthly)
      // First add the contribution, then apply the interest
      const monthlyInterestRate = 0.08 / 12; // Monthly equivalent of 8% annual
      npsCorpus += npsContribution;
      npsCorpus *= (1 + monthlyInterestRate);
      
      // Add to timeline
      timeline.push({
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
    
    // Calculate NPS and UPS benefits
    const npsBenefits = calculateNPSBenefits(npsCorpus);
    const upsBenefits = calculateUPSBenefits(
      timeline, 
      completedHalfYears, 
      isUPSEligible, 
      npsBenefits.monthlyPension
    );
    
    // Calculate total values
    const npsTotalValue = npsBenefits.lumpSum + (npsBenefits.monthlyPension * 12 * 20); // 20 years
    const upsTotalValue = upsBenefits.gratuity + (upsBenefits.avgPensionWith20YearDA * 12 * 20); // 20 years
    
    const lastSalary = timeline[timeline.length - 1];
    
    // Prepare results
    const results = {
      nps: npsBenefits,
      ups: upsBenefits,
      serviceYears: Math.round(totalServiceYears),
      completedHalfYears,
      retirementBasic: lastSalary.basic,
      finalDA: lastSalary.daPercent,
      differenceValue: npsTotalValue - upsTotalValue,
      isUPSEligible,
      cpcEvents,
      npsTotalValue,
      upsTotalValue
    };
    
    return { results, timeline };
  } catch (error) {
    console.error("Calculation error:", error);
    return { error: "An error occurred during calculation. Please check your inputs and try again." };
  }
};