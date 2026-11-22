import { useEffect, useMemo, useState } from 'react';
import { ApiError, getGraphQLResource } from '../lib/api.js';

/** Estado de GraphQL con useState/useEffect, deduplicación y reintento; no altera el hook REST. */
export function useGraphQLResource(query, variables, validate, enabled = true) {
  const variablesKey = JSON.stringify(variables);
  const stableVariables = useMemo(() => JSON.parse(variablesKey), [variablesKey]);
  const requestKey = `${query}\n${variablesKey}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ requestKey, status: 'loading', data: null, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    getGraphQLResource(query, stableVariables, { force: attempt > 0 }).then(
      (data) => {
        if (!active) return;
        if (validate && !validate(data)) {
          setState({ requestKey, status: 'error', data: null, error: new ApiError('GraphQL devolvió vuelos u hoteles incompletos.', { code: 'INVALID_RESPONSE' }) });
        } else setState({ requestKey, status: 'success', data, error: null });
      },
      (error) => { if (active) setState({ requestKey, status: 'error', data: null, error }); },
    );
    return () => { active = false; };
  }, [query, stableVariables, requestKey, attempt, validate, enabled]);

  const retry = () => {
    setState({ requestKey, status: 'loading', data: null, error: null });
    setAttempt((value) => value + 1);
  };
  return { ...(!enabled ? { requestKey, status: 'idle', data: null, error: null } : state.requestKey === requestKey ? state : { requestKey, status: 'loading', data: null, error: null }), retry };
}
