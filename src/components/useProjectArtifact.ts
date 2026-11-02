import { useEffect, useRef } from 'react';
import { getActiveProjectId, setToolState } from '../services/projectService';

/** Retain derived documents after a short pause, and flush the last value when leaving a tool. */
export function useProjectArtifact(key: string, value: unknown, enabled: boolean) {
  const projectId = useRef(getActiveProjectId()).current;
  const serialized = JSON.stringify(enabled ? value : null);
  const latest = useRef(serialized);
  latest.current = serialized;
  useEffect(() => {
    const timer = setTimeout(() => setToolState(key, JSON.parse(serialized), projectId), 700);
    return () => clearTimeout(timer);
  }, [key, serialized, projectId]);
  useEffect(() => () => { setToolState(key, JSON.parse(latest.current), projectId); }, [key, projectId]);
}
