import { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { api } from '../data/api';
import { useToast } from '../components/Toast';
import { MUSCLE_GROUPS } from '../data/constants';
import StartWorkout from './log/StartWorkout';
import ActiveWorkout from './log/ActiveWorkout';
import styles from './Log.module.css';

export default function Log({ onMenuOpen }) {
  const { session } = useWorkout();

  if (session) return <ActiveWorkout onMenuOpen={onMenuOpen} />;
  return <StartWorkout onMenuOpen={onMenuOpen} />;
}
