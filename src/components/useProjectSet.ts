import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useProjectState } from './useProjectState';

export function useProjectSet(key: string): [Set<string>, Dispatch<SetStateAction<Set<string>>>] {
  const [ids, setIds] = useProjectState<string[]>(key, []);
  const value = useMemo(() => new Set(ids), [ids]);
  const update: Dispatch<SetStateAction<Set<string>>> = useCallback(next => setIds(previous => [...(typeof next === 'function' ? next(new Set(previous)) : next)]), [setIds]);
  return [value, update];
}
