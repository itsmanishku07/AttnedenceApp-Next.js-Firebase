'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import type { QrCodeSuccessCallback } from 'html5-qrcode/esm/core';

interface QrScannerProps {
  onScanSuccess: QrCodeSuccessCallback;
  onScanFailure?: (error: string) => void;
}

export function QrScanner({ onScanSuccess, onScanFailure }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader";

  useEffect(() => {
    // Ensure the scanner is only initialized once.
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, { verbose: false });
    }
    
    const scanner = scannerRef.current;
    
    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.8);
              return { width: qrboxSize, height: qrboxSize };
            },
          },
          onScanSuccess,
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage);
          }
        );
      } catch (err) {
        console.error('Failed to start scanner', err);
        if (onScanFailure) {
          if (err instanceof Error) {
            onScanFailure(`Failed to start camera: ${err.name} - ${err.message}`);
          } else {
             onScanFailure('Failed to start camera.');
          }
        }
      }
    };

    // Start scanner only if it's not already running.
    if (scanner.getState() === Html5QrcodeScannerState.NOT_STARTED) {
      startScanner();
    }

    // Cleanup function to stop the scanner.
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => {
          console.error("Failed to stop scanner cleanly", err);
        });
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id={readerId} className="w-full max-w-md mx-auto aspect-square"></div>;
}
