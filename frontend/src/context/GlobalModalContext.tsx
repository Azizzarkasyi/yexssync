import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type GlobalModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'radar';

export interface RadarData {
  officeName?: string;
  currentDistance?: number | null;
  maxRadius?: number;
  isLocked?: boolean;
  accuracy?: number;
  statusText?: string;
  bestDistance?: number | null;
}

export interface GlobalModalOptions {
  type?: GlobalModalType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'primary' | 'danger' | 'success';
  autoCloseMs?: number;
  radarData?: RadarData;
  customContent?: React.ReactNode;
}

interface GlobalModalContextType {
  modalState: {
    visible: boolean;
    options: GlobalModalOptions;
  };
  showModal: (options: GlobalModalOptions) => void;
  hideModal: () => void;
  updateRadarData: (data: Partial<RadarData>) => void;
  showSuccess: (title: string, message?: string, onConfirm?: () => void) => void;
  showError: (title: string, message?: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message?: string, onConfirm?: () => void) => void;
  showInfo: (title: string, message?: string, onConfirm?: () => void) => void;
  showConfirm: (params: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  showLocationRadar: (params: {
    title?: string;
    message?: string;
    officeName?: string;
    maxRadius?: number;
    initialDistance?: number | null;
    onCancel?: () => void;
  }) => void;
}

const defaultOptions: GlobalModalOptions = {
  type: 'info',
  title: '',
  message: '',
  confirmText: 'Mengerti',
  cancelText: 'Batal',
};

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined);

export const GlobalModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    visible: boolean;
    options: GlobalModalOptions;
  }>({
    visible: false,
    options: defaultOptions,
  });

  const autoCloseTimerRef = useRef<any>(null);

  const hideModal = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setModalState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showModal = useCallback(
    (options: GlobalModalOptions) => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      setModalState({
        visible: true,
        options: {
          ...defaultOptions,
          ...options,
        },
      });

      if (options.autoCloseMs && options.autoCloseMs > 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          hideModal();
          if (options.onConfirm) options.onConfirm();
        }, options.autoCloseMs);
      }
    },
    [hideModal]
  );

  const updateRadarData = useCallback((data: Partial<RadarData>) => {
    setModalState((prev) => {
      if (!prev.visible || prev.options.type !== 'radar') return prev;
      return {
        ...prev,
        options: {
          ...prev.options,
          radarData: {
            ...prev.options.radarData,
            ...data,
          },
        },
      };
    });
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({
        type: 'success',
        title,
        message,
        confirmText: 'Lanjutkan',
        onConfirm: () => {
          hideModal();
          if (onConfirm) onConfirm();
        },
      });
    },
    [showModal, hideModal]
  );

  const showError = useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({
        type: 'error',
        title,
        message,
        confirmText: 'Tutup',
        onConfirm: () => {
          hideModal();
          if (onConfirm) onConfirm();
        },
      });
    },
    [showModal, hideModal]
  );

  const showWarning = useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({
        type: 'warning',
        title,
        message,
        confirmText: 'Mengerti',
        onConfirm: () => {
          hideModal();
          if (onConfirm) onConfirm();
        },
      });
    },
    [showModal, hideModal]
  );

  const showInfo = useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({
        type: 'info',
        title,
        message,
        confirmText: 'Oke',
        onConfirm: () => {
          hideModal();
          if (onConfirm) onConfirm();
        },
      });
    },
    [showModal, hideModal]
  );

  const showConfirm = useCallback(
    (params: {
      title: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'primary' | 'danger';
      onConfirm: () => void | Promise<void>;
      onCancel?: () => void;
    }) => {
      showModal({
        type: 'confirm',
        title: params.title,
        message: params.message,
        confirmText: params.confirmText || 'Ya, Lanjutkan',
        cancelText: params.cancelText || 'Batal',
        variant: params.variant || 'primary',
        onConfirm: async () => {
          hideModal();
          await params.onConfirm();
        },
        onCancel: () => {
          hideModal();
          if (params.onCancel) params.onCancel();
        },
      });
    },
    [showModal, hideModal]
  );

  const showLocationRadar = useCallback(
    (params: {
      title?: string;
      message?: string;
      officeName?: string;
      maxRadius?: number;
      initialDistance?: number | null;
      onCancel?: () => void;
    }) => {
      showModal({
        type: 'radar',
        title: params.title || 'Mencari Radius Kantor Terdekat',
        message:
          params.message ||
          'Sistem sedang memindai koordinat GPS Anda secara langsung untuk mengunci posisi di dalam jangkauan kantor.',
        cancelText: 'Batalkan',
        onCancel: () => {
          hideModal();
          if (params.onCancel) params.onCancel();
        },
        radarData: {
          officeName: params.officeName || 'Kantor Tujuan',
          currentDistance: params.initialDistance ?? null,
          maxRadius: params.maxRadius || 50,
          isLocked: false,
          statusText: 'Menghubungkan ke satelit GPS...',
        },
      });
    },
    [showModal, hideModal]
  );

  return (
    <GlobalModalContext.Provider
      value={{
        modalState,
        showModal,
        hideModal,
        updateRadarData,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        showLocationRadar,
      }}
    >
      {children}
    </GlobalModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider');
  }
  return context;
};
