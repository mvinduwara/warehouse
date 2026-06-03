import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";

export interface BarcodeScanResult {
  text: string;
  format: string;
}

export interface UseBarcodeScanOptions {
  onScan: (result: BarcodeScanResult) => void;
  onError?: (error: Error) => void;
  formats?: BarcodeFormat[];
}

export function useBarcodeScan(opts: UseBarcodeScanOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, opts.formats ?? [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.DATA_MATRIX,
    ]);

    readerRef.current = new BrowserMultiFormatReader(hints);

    readerRef.current.listVideoInputDevices().then((videoInputDevices) => {
      setDevices(videoInputDevices);
      setHasCamera(videoInputDevices.length > 0);
      if (videoInputDevices.length > 0) {
        const backCamera = videoInputDevices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        setDeviceId(backCamera?.deviceId ?? videoInputDevices[0]?.deviceId);
      }
    }).catch(() => setHasCamera(false));

    return () => {
      readerRef.current?.reset();
    };
  }, []);

  const startScan = useCallback((videoElement: HTMLVideoElement) => {
    if (!readerRef.current || !deviceId) return;
    videoRef.current = videoElement;
    setIsScanning(true);

    readerRef.current.decodeFromVideoDevice(
      deviceId,
      videoElement,
      (result, err) => {
        if (result) {
          opts.onScan({ text: result.getText(), format: result.getBarcodeFormat().toString() });
        }
        if (err && !(err.name === "NotFoundException")) {
          opts.onError?.(err as Error);
        }
      }
    );
  }, [deviceId, opts]);

  const stopScan = useCallback(() => {
    readerRef.current?.reset();
    setIsScanning(false);
  }, []);

  return { isScanning, hasCamera, devices, deviceId, setDeviceId, startScan, stopScan };
}