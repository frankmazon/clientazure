import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

type Props = { value: string; onChange: (image: string) => void };
export default function SignaturePad({ value, onChange }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const moved = useRef(false);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    context.clearRect(0, 0, element.width, element.height);
    if (!value) return;
    const image = new Image();
    let cancelled = false;
    image.onload = () => { if (!cancelled) context.drawImage(image, 0, 0); };
    image.src = value;
    return () => { cancelled = true; };
  }, [value]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - rect.left) * 900 / rect.width, (event.clientY - rect.top) * 300 / rect.height];
  };
  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== null || event.button !== 0) return;
    event.preventDefault();
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    pointer.current = event.pointerId; moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath(); context.lineWidth = 3; context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = '#173646';
    const [x, y] = point(event); context.moveTo(x, y);
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== event.pointerId) return;
    const context = event.currentTarget.getContext('2d');
    const [x, y] = point(event); context?.lineTo(x, y); context?.stroke(); moved.current = true;
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    if (moved.current) onChange(event.currentTarget.toDataURL('image/png'));
  };
  return <div className="rounded-2xl border border-teal-200 bg-white p-3">
    <div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">Draw your signature</p><p id="signature-help" className="text-xs text-slate-500">Use your mouse, finger, or stylus in the box below.</p></div><button type="button" onClick={() => onChange('')} className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">Clear</button></div>
    <canvas ref={canvas} width={900} height={300} aria-label="Signature drawing area" aria-describedby="signature-help" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} className="block aspect-[3/1] w-full touch-none rounded-xl border border-dashed border-teal-300 bg-teal-50/30" style={{ cursor: 'crosshair' }}>Draw a handwritten signature using a pointer-enabled browser.</canvas>
    <p className="mt-2 text-xs text-slate-500">{value ? 'Signature captured. Clear to draw again.' : 'A handwritten signature is required before submitting.'}</p>
  </div>;
}
