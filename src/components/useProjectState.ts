import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  getActiveProjectId,
  getToolState,
  setToolState,
} from "../services/projectService";

export function useProjectState<T>(
  key: string,
  fallback: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const saved = getToolState<T | undefined>(key, undefined);
    return saved !== undefined
      ? saved
      : typeof fallback === "function"
        ? (fallback as () => T)()
        : fallback;
  });
  const current = useRef(value);
  const projectId = useRef(getActiveProjectId()).current;
  const update: Dispatch<SetStateAction<T>> = useCallback((next: SetStateAction<T>) => {
    const updated =
      typeof next === "function"
        ? (next as (p: T) => T)(current.current)
        : next;
    try {
      setToolState(key, updated, projectId);
    } catch {
      /* Global banner reports failure. */
    }
    current.current = updated;
    setValue(updated);
  }, [key, projectId]);
  return [value, update];
}
