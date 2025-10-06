import api from "../api";

export const rentalService = {
  getActiveRentals: async () => {
    const response = await api.get("/api/rentals/active");
    return response.data;
  },

  getRentalHistory: async () => {
    const response = await api.get("/api/rentals/history");
    return response.data;
  },

  createRental: async (data) => {
    try {
      const response = await api.post("/api/rentals", {
        roomId: data.roomId,
        carNumber: data.carNumber || '',
        numberOfGuests: data.numberOfGuests,
        checkInTime: data.checkInTime || new Date().toISOString(),
        rentType: data.rentType || 'hourly',
        drinks: data.drinks || [],
        isWalkIn: data.isWalkIn || false
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  calculateCheckout: async (rentalId, additionalCharges = 0, checkoutTime, discount = 0, payment = {}) => {
    const response = await api.post(`/api/rentals/calculate-checkout`, {
      rentalId,
      additionalCharges,
      discount,
      checkoutTime: checkoutTime,
      payment: {
        amount: payment.amount || 0,
        method: payment.method || 'cash'
      }
    });
    return response.data;
  },

  checkout: async (rentalId, checkoutData) => {
    const response = await api.post(`/api/rentals/checkout`, {
      rentalId,
      additionalCharges: checkoutData.additionalCharges || 0,
      discount: checkoutData.discount || 0,
      payment_method: checkoutData.payment_method || 'cash',
      customerPayment: checkoutData.customerPayment || 0,
      note: checkoutData.note || '',
      checkoutTime: checkoutData.checkoutTime
    });
    return response.data;
  },

  addDrinkToRental: async (rentalId, drinkData) => {
    try {
      const response = await api.post(`/api/rentals/${rentalId}/drinks`, {
        drinkId: drinkData.id,
        name: drinkData.name,
        quantity: drinkData.quantity || 1,
        price: drinkData.sellingPrice
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateDrinkQuantity: async (rentalId, drinkId, change) => {
    try {
      const response = await api.patch(`/api/rentals/${rentalId}/drinks/${drinkId}`, {
        change
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteDrink: async (rentalId, drinkId) => {
    const response = await api.delete(`/api/rentals/${rentalId}/drinks/${drinkId}`);
    return response.data;
  },

  updateSettings: async (rentalId, settings) => {
    const response = await api.patch(`/api/rentals/${rentalId}/settings`, settings);
    return response.data;
  }
};
