import { useWorkout } from '../context/WorkoutContext';
import StartWorkout from './log/StartWorkout';
import ActiveWorkout from './log/ActiveWorkout';
import WorkoutSummary from './log/WorkoutSummary';

export default function Log({ onMenuOpen }) {
  const { session, lastCompleted } = useWorkout();

  if (lastCompleted) return <WorkoutSummary />;
  if (session)       return <ActiveWorkout onMenuOpen={onMenuOpen} />;
  return <StartWorkout onMenuOpen={onMenuOpen} />;
}
