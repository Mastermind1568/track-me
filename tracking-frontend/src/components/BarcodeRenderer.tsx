import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
}

export default function BarcodeRenderer({ value }: BarcodeProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        lineColor: "#000000",
        width: 2,
        height: 60,
        displayValue: true,
        fontOptions: "bold",
        font: "sans-serif",
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 8,
        fontSize: 16,
        background: "#ffffff",
        margin: 0
      });
    }
  }, [value]);

  return (
    <div className="flex justify-center p-4 bg-white border-4 border-black">
      <svg ref={barcodeRef}></svg>
    </div>
  );
}
