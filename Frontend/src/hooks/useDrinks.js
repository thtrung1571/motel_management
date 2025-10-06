import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export const useDrinks = (rental, open) => {
  const [drinks, setDrinks] = useState([]);
  const [processedDrinks, setProcessedDrinks] = useState([]);

  const updateDrinkStock = useCallback((drinkStock) => {
    setDrinks(prevDrinks => 
      prevDrinks.map(drink => 
        drink.id === drinkStock.id 
          ? { ...drink, ...drinkStock }
          : drink
      )
    );
  }, []);

  const fetchDrinks = async () => {
    try {
      const response = await api.get('/api/drinks');
      setDrinks(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch drinks:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDrinks();
    }
  }, [open]);

  useEffect(() => {
    if (rental?.drinks) {
      const drinks = rental.drinks.map(drink => ({
        id: drink.id,
        name: drink.name,
        quantity: drink.quantity,
        price: drink.price,
        drinkId: drink.drinkId
      }));
      setProcessedDrinks(drinks);
    }
  }, [rental]);

  return {
    drinks,
    processedDrinks,
    setProcessedDrinks,
    updateDrinkStock
  };
}; 