import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const ScoreContext = createContext(null);

export function ScoreProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [healthPercent, setHealthPercent] = useState(0);
  const [completedSystems, setCompletedSystems] = useState(0);
  const [totalSystems, setTotalSystems] = useState(0);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLearnData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/learn/systems');
      const { categories, totalScore, healthPercent, completedSystems, totalSystems } = res.data;
      setCategories(categories);
      setTotalScore(totalScore);
      setHealthPercent(healthPercent);
      setCompletedSystems(completedSystems);
      setTotalSystems(totalSystems);
    } catch (err) {
      console.error('Failed to fetch learn data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markComplete = useCallback(async (resourceId) => {
    const prevCategories = categories;
    const prevTotalScore = totalScore;
    const prevHealthPercent = healthPercent;
    const prevCompletedSystems = completedSystems;

    // Optimistically mark resource as completed
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        systems: cat.systems.map((sys) =>
          sys.resourceId === resourceId ? { ...sys, isCompleted: true } : sys
        ),
      }))
    );
    setCompletedSystems((prev) => prev + 1);

    try {
      const res = await api.post(`/learn/complete/${resourceId}`);
      const { totalScore: newTotal, healthPercent: newHealth } = res.data;
      setTotalScore(newTotal);
      setHealthPercent(newHealth);
    } catch (err) {
      console.error('Failed to mark complete:', err);
      setCategories(prevCategories);
      setTotalScore(prevTotalScore);
      setHealthPercent(prevHealthPercent);
      setCompletedSystems(prevCompletedSystems);
    }
  }, [categories, totalScore, healthPercent, completedSystems]);

  const unmarkComplete = useCallback(async (resourceId) => {
    const prevCategories = categories;
    const prevTotalScore = totalScore;
    const prevHealthPercent = healthPercent;
    const prevCompletedSystems = completedSystems;

    // Optimistically mark resource as not completed
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        systems: cat.systems.map((sys) =>
          sys.resourceId === resourceId ? { ...sys, isCompleted: false } : sys
        ),
      }))
    );
    setCompletedSystems((prev) => prev - 1);

    try {
      const res = await api.delete(`/learn/complete/${resourceId}`);
      const { totalScore: newTotal, healthPercent: newHealth } = res.data;
      setTotalScore(newTotal);
      setHealthPercent(newHealth);
    } catch (err) {
      console.error('Failed to unmark complete:', err);
      setCategories(prevCategories);
      setTotalScore(prevTotalScore);
      setHealthPercent(prevHealthPercent);
      setCompletedSystems(prevCompletedSystems);
    }
  }, [categories, totalScore, healthPercent, completedSystems]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/scorecard/history');
      setScoreHistory(res.data.history);
    } catch (err) {
      console.error('Failed to fetch score history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScoreContext.Provider
      value={{
        categories,
        totalScore,
        healthPercent,
        completedSystems,
        totalSystems,
        scoreHistory,
        loading,
        fetchLearnData,
        markComplete,
        unmarkComplete,
        fetchHistory,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  return useContext(ScoreContext);
}
