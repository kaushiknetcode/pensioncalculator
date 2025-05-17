// src/components/pension/utils/calculatePension.js

import { findIndexForBasic, getNextBasicPay } from './payMatrixUtils';

export const calculatePension = (formData, promotions, payMatrix) => {
  try {
    // Parse input data
    const today = new Date();
    const currentLevel = parseInt(formData.payLevel);
    const currentBasic = parseInt(formData.currentBasic);
    const currentDA = parseFloat(formData.currentDA) / 100;
    const incrementMonth = formData.incrementMonth;
    const joiningDate = new Date(formData.dateOfJoining);
    const retirementDate = new Date(formData.retirementDate);
    const initialNPSCorpus = parseFloat(formData.currentNPSCorpus) || 0;

    // Set simulation start date based on currentNPSCorpus
    const simulationStartDate = initialNPSCorpus > 0 ? today : joiningDate;

    // Validate dates
    if (retirementDate <= simulationStartDate) {
      return { error: 'Retirement date must be after start date' };
    }

    // Calculate service period
    const totalMonthsOfService = Math.round((retirementDate - simulationStartDate) / (30 * 24 * 60 * 60 * 1000));
    const completedHalfYears = Math.floor(totalMonthsOfService / 6);
    const totalServiceYears = totalMonthsOfService / 12;

    // Check UPS eligibility (minimum 10 years)
    const isUPSEligible = totalServiceYears >= 10;

    // Sort and filter promotions
    const validPromotions = promotions
      .filter(p => p.date && p.newLevel && p.newBasic && new Date(p.date) >= simulationStartDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let timeline = [];
    let currentDate = new Date(simulationStartDate);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let level = currentLevel;
    let basic = currentBasic;
    let index = findIndexForBasic(payMatrix, level, basic);
    let da = currentDA;
    let npsCorpus = initialNPSCorpus;

    // Calculate next CPC year
    let nextCPCYear = Math.ceil(currentYear / 10) * 10 + 6;
    const cpcEvents = [];

    // Simulate month by month until retirement
    while (currentDate <= retirementDate) {
      // Check for promotions
      const duePromotion = validPromotions.find(p => {
        const promotionDate = new Date(p.date);
        return promotionDate.getFullYear() === currentYear && 
               promotionDate.getMonth() === currentMonth;
      });

      if (duePromotion) {
        const oldBasic = basic;
        level = parseInt(duePromotion.newLevel);
        basic = parseInt(duePromotion.newBasic);

        // Validate pay protection rule
        if (basic < oldBasic * 1.03) {
          return { 
            error: `Promotion violates pay protection rule. New basic must be at least ₹${Math.ceil(oldBasic * 1.03)}` 
          };
        }

        index = findIndexForBasic(payMatrix, level, basic);
      }

      // Check for CPC implementation
      if (currentMonth === 0 && currentYear === nextCPCYear) {
        const preCPCBasic = basic;
        basic = Math.round(basic * 2); // Fitment factor of 2.0
        da = 0; // Reset DA to 0%

        cpcEvents.push({
          year: currentYear,
          oldBasic: preCPCBasic,
          newBasic: basic
        });

        nextCPCYear += 10;
      }

      // Check for annual increment
      if ((incrementMonth === 'Jan' && currentMonth === 0) || 
          (incrementMonth === 'Jul' && currentMonth === 6)) {
        if (index < 40) {
          index++;
          basic = getNextBasicPay(payMatrix, level, index);
        }
      }

      // Check for DA change
      if (currentMonth === 0 || currentMonth === 6) {
        da += 0.03;
      }

      // Calculate monthly values
      const daAmount = Math.round(basic * da);
      const grossSalary = basic + daAmount;
      const npsContribution = grossSalary * 0.24;
      const monthlyInterestRate = 0.08 / 12;
      
      npsCorpus += npsContribution;
      npsCorpus *= (1 + monthlyInterestRate);

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
      currentDate = new Date(currentYear, currentMonth);
    }

    // Calculate benefits
    const finalNPSCorpus = Math.round(npsCorpus);
    const npsLumpSum = Math.round(finalNPSCorpus * 0.6);
    const npsAnnuityCorpus = Math.round(finalNPSCorpus * 0.4);
    const annuityRate = 6.5;
    const npsMonthlyPension = Math.round((npsAnnuityCorpus * (annuityRate / 100)) / 12);

    const lastTenMonths = timeline.slice(-10);
    const avgEmoluments = lastTenMonths.reduce((sum, month) => 
      sum + (month.basic * (1 + (month.daPercent / 100))), 0) / lastTenMonths.length;
    
    const upsMonthlyPension = isUPSEligible ? Math.round(avgEmoluments * 0.5) : 0;
    
    const lastSalary = timeline[timeline.length - 1];
    const gratuityBase = lastSalary.basic * (1 + (lastSalary.daPercent / 100));
    let gratuity = Math.round(gratuityBase * 0.10 * completedHalfYears);
    gratuity = Math.min(gratuity, 2000000);

    const npsTotalValue = npsLumpSum + (npsMonthlyPension * 12 * 20);
    const upsTotalValue = gratuity + (upsMonthlyPension * 12 * 20);

    const results = {
      nps: {
        corpus: finalNPSCorpus,
        lumpSum: npsLumpSum,
        annuityCorpus: npsAnnuityCorpus,
        monthlyPension: npsMonthlyPension,
        annuityRate
      },
      ups: {
        avgBasic: Math.round(avgEmoluments),
        monthlyPension: upsMonthlyPension,
        gratuity,
        avgPensionWith20YearDA: upsMonthlyPension
      },
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
    return { 
      error: "An error occurred during calculation. Please check your inputs and try again." 
    };
  }
};