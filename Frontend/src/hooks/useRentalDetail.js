import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export const useRentalDetail = (rental, open) => {
  const [rentalData, setRentalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const fetchRentalData = useCallback(async () => {
    if (!rental?._id) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/api/rentals/${rental._id}`);
      if (response.data?.status === 'success') {
        setRentalData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rental data:', error);
      setRentalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [rental?._id]);

  useEffect(() => {
    if (rental && Object.keys(rental).length > 0) {
      setRentalData(rental);
    }
  }, [rental]);

  useEffect(() => {
    if (open && rental?._id) {
      fetchRentalData();
      setShouldRefresh(false);
    } else if (!open) {
      setRentalData(null);
    }
  }, [open, rental?._id, shouldRefresh, fetchRentalData]);

  return {
    rentalData,
    isLoading,
    refreshData: useCallback(() => setShouldRefresh(true), []),
    setRentalData
  };
}; 