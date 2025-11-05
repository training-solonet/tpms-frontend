import { useState, useCallback } from 'react';

/**
 * Custom hook for managing alert modals
 *
 * @example
 * const { showAlert, AlertComponent } = useAlert();
 *
 * // Show success alert
 * showAlert.success('Data saved successfully!');
 *
 * // Show error alert
 * showAlert.error('Failed to delete item.');
 *
 * // Show confirmation dialog
 * showAlert.confirm('Are you sure you want to delete this item?', () => {
 *   // Handle delete
 * });
 *
 * return (
 *   <>
 *     <YourComponent />
 *     {AlertComponent}
 *   </>
 * );
 */

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = {
    success: useCallback(
      (message, title = 'Success!', onConfirm) => {
        setAlertState({
          isOpen: true,
          type: 'success',
          title,
          message,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          showCancel: false,
          confirmText: 'Continue',
        });
      },
      [closeAlert]
    ),

    error: useCallback(
      (message, title = 'Oooops!', onConfirm) => {
        setAlertState({
          isOpen: true,
          type: 'error',
          title,
          message,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          showCancel: false,
          confirmText: 'Try Again',
        });
      },
      [closeAlert]
    ),

    warning: useCallback(
      (message, title = 'Warning!', onConfirm) => {
        setAlertState({
          isOpen: true,
          type: 'warning',
          title,
          message,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          showCancel: false,
          confirmText: 'OK',
        });
      },
      [closeAlert]
    ),

    info: useCallback(
      (message, title = 'Information', onConfirm) => {
        setAlertState({
          isOpen: true,
          type: 'info',
          title,
          message,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          showCancel: false,
          confirmText: 'OK',
        });
      },
      [closeAlert]
    ),

    confirm: useCallback(
      (message, onConfirm, title = 'Are you sure?') => {
        setAlertState({
          isOpen: true,
          type: 'warning',
          title,
          message,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          onCancel: closeAlert,
          showCancel: true,
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
        });
      },
      [closeAlert]
    ),

    delete: useCallback(
      (itemName, onConfirm) => {
        setAlertState({
          isOpen: true,
          type: 'warning',
          title: 'Delete Confirmation',
          message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
          onConfirm: () => {
            onConfirm?.();
            closeAlert();
          },
          onCancel: closeAlert,
          showCancel: true,
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
        });
      },
      [closeAlert]
    ),
  };

  return {
    showAlert,
    closeAlert,
    alertState,
  };
};

export default useAlert;
