// src/components/pension/PromotionsSection.jsx
import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const PromotionsSection = ({ promotions, addPromotion, updatePromotion, removePromotion, payMatrix }) => {
  return (
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
  );
};

export default PromotionsSection;