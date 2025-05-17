// src/components/pension/utils/payMatrixUtils.js

// Generate a mock pay matrix for testing
export const generateMockPayMatrix = () => {
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

// Find index in pay matrix for a specific basic pay
export const findIndexForBasic = (matrix, level, basic) => {
  if (!matrix[level]) return 1;
  
  const entries = Object.entries(matrix[level]);
  for (const [index, value] of entries) {
    if (Number(value) === Number(basic)) return parseInt(index);
  }
  
  // Default to 1 if not found
  return 1;
};

// Get next basic pay based on level and index
export const getNextBasicPay = (matrix, level, index) => {
  if (!matrix[level]) return null;
  
  // If we've reached the max index, stay at that pay
  if (index > 40) return matrix[level][40];
  
  return matrix[level][index] || matrix[level][40]; // Fallback to max if not found
};