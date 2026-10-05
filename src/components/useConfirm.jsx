import React, { useCallback, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

/**
 * Promise-based confirmation.
 *
 * Mounts one <ConfirmDialog /> and returns a `confirm(options)` function that
 * resolves to a boolean, so a destructive action reads sequentially instead of
 * hiding state inside a modal component:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel: 'Delete' }))) return;
 *
 * Mount the hook once, high in the tree (the App shell). A second request while
 * one is open resolves the first as `false` rather than queuing, because a stale
 * confirmation must never authorise a later action.
 */
export function useConfirm() {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    // An already-open dialog is cancelled rather than stacked.
    if (resolver.current) {
      const previous = resolver.current;
      resolver.current = null;
      previous(false);
    }
    return new Promise((resolve) => {
      resolver.current = resolve;
      setRequest(options);
    });
  }, []);

  const handleClose = useCallback((result) => {
    const resolve = resolver.current;
    resolver.current = null;
    setRequest(null);
    if (resolve) resolve(Boolean(result));
  }, []);

  const element = <ConfirmDialog request={request} onClose={handleClose} />;

  return { confirm, confirmElement: element };
}

export default useConfirm;