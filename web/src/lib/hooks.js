import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from './api.js';

export function useTitle(title) {
  useEffect(() => { document.title = title; }, [title]);
}

export function useParam(name) {
  const [params] = useSearchParams();
  return params.get(name);
}

// Load an API path: { data, error, loading }. Pass null to skip.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  useEffect(() => {
    if (!path) return setState({ data: null, error: null, loading: false });
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path).then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error) => live && setState({ data: null, error, loading: false }),
    );
    return () => { live = false; };
  }, [path]);
  return state;
}
