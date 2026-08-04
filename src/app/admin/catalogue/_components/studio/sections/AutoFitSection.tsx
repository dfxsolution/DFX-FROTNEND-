"use client";

import React from 'react';
import { Scan, Crosshair, Maximize2, Eraser, Wand2, Square as SquareIcon, RectangleVertical, RectangleHorizontal, Instagram, MessageCircle } from 'lucide-react';
import { Collapsible } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudio } from '../StudioContext';
import type { OutputPresetKey } from '@/services/catalogueService';

const SIZE_PRESETS: { key: OutputPresetKey; label: string; icon: React.ElementType }[] = [
  { key: 'SQUARE', label: 'Square', icon: SquareIcon },
  { key: 'PORTRAIT', label: 'Portrait', icon: RectangleVertical },
  { key: 'LANDSCAPE', label: 'Landscape', icon: RectangleHorizontal },
  { key: 'INSTAGRAM_POST', label: 'Instagram', icon: Instagram },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
];

/**
 * Auto Fit deliberately spans two different real subsystems, shown as two
 * clearly-labeled groups rather than blurred together:
 *  - Fit Adjustments (Remove Empty Space / Auto Center / Auto Scale) are
 *    real Phase A ImageEditOperations, applied to the image itself.
 *  - Target Size presets set the render-time Output Preset (Phase B) that
 *    Steps 4-6 use — they don't touch the image, they size the final
 *    rendered canvas.
 */
const AUTO_FIT_PADDING_RATIO = 0.05;
const AUTO_FIT_FILL_RATIO = 0.85;

export const AutoFitSection: React.FC = () => {
  const { editOperations, applyEditOperation, applyEditOperations, removeEditOperationType, outputPreset, setOutputPreset } = useStudio();

  const removeEmptySpace = editOperations.find((o) => o.type === 'REMOVE_EMPTY_SPACE');
  const autoCenter = editOperations.find((o) => o.type === 'AUTO_CENTER');
  const autoScale = editOperations.find((o) => o.type === 'AUTO_SCALE');

  const allApplied = Boolean(removeEmptySpace && autoCenter && autoScale);

  const runOneClickAutoFit = () =>
    applyEditOperations([
      { type: 'REMOVE_EMPTY_SPACE', padding_ratio: AUTO_FIT_PADDING_RATIO },
      { type: 'AUTO_CENTER', padding_ratio: AUTO_FIT_PADDING_RATIO },
      { type: 'AUTO_SCALE', fill_ratio: AUTO_FIT_FILL_RATIO },
    ]);

  return (
    <Collapsible title="Auto Fit" icon={Scan} defaultOpen>
      <div>
        <Button
          size="sm"
          variant={allApplied ? 'primary' : 'outline'}
          className="w-full gap-1.5 justify-center py-2.5"
          onClick={runOneClickAutoFit}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>{allApplied ? 'Auto Fit Applied — Re-run' : 'One-Click Auto Fit'}</span>
        </Button>
        <p className="text-[11px] text-slate-500 mt-1.5 mb-3">
          Trims empty borders, centers the product, and scales it to fill ~85% of the canvas — all three, one step.
        </p>

        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Fit Adjustments</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eraser className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-[#0B0E23]">Remove Empty Space</span>
            </div>
            <Button
              size="sm"
              variant={removeEmptySpace ? 'primary' : 'outline'}
              onClick={() =>
                removeEmptySpace
                  ? removeEditOperationType('REMOVE_EMPTY_SPACE')
                  : applyEditOperation({ type: 'REMOVE_EMPTY_SPACE', padding_ratio: 0.05 })
              }
            >
              {removeEmptySpace ? 'Applied' : 'Trim'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-[#0B0E23]">Auto Center</span>
            </div>
            <Button
              size="sm"
              variant={autoCenter ? 'primary' : 'outline'}
              onClick={() =>
                autoCenter
                  ? removeEditOperationType('AUTO_CENTER')
                  : applyEditOperation({ type: 'AUTO_CENTER', padding_ratio: 0.05 })
              }
            >
              {autoCenter ? 'Applied' : 'Center'}
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-[#0B0E23]">Auto Scale</span>
          </div>
          <Slider
            min={0.3}
            max={1}
            step={0.05}
            value={(autoScale as any)?.fill_ratio ?? AUTO_FIT_FILL_RATIO}
            formatValue={(v) => `${Math.round(v * 100)}% fill`}
            onChange={(v) => applyEditOperation({ type: 'AUTO_SCALE', fill_ratio: v })}
          />
        </div>
      </div>

      <div className="pt-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Target Size (Output Preset)</p>
        <div className="grid grid-cols-3 gap-2">
          {SIZE_PRESETS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setOutputPreset(outputPreset === key ? null : key)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all duration-150',
                outputPreset === key
                  ? 'bg-gold text-white border-gold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-gold/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Collapsible>
  );
};
