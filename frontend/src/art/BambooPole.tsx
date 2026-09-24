import React from 'react';

export interface PipelineStage {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  status: 'pending' | 'active' | 'completed';
  toolCallsCount?: number;
}

interface BambooPoleProps {
  stages: PipelineStage[];
  currentStageId?: string;
  onSelectStage?: (stageId: string) => void;
  className?: string;
}

export const BambooPole: React.FC<BambooPoleProps> = ({
  stages,
  currentStageId,
  onSelectStage,
  className = '',
}) => {
  return (
    <div className={`w-full py-4 select-none ${className}`}>
      {/* Horizontal Bamboo Pole with Knots */}
      <div className="relative h-6 flex items-center mx-4 mb-2">
        <div className="w-full h-3.5 bg-amber-200 border-2 border-ink rounded-full relative shadow-sm">
          {/* Bamboo segments / notches */}
          <div className="absolute left-[15%] inset-y-0 w-1 bg-amber-400 border-x border-ink/40" />
          <div className="absolute left-[38%] inset-y-0 w-1 bg-amber-400 border-x border-ink/40" />
          <div className="absolute left-[62%] inset-y-0 w-1 bg-amber-400 border-x border-ink/40" />
          <div className="absolute left-[85%] inset-y-0 w-1 bg-amber-400 border-x border-ink/40" />
        </div>
      </div>

      {/* Hanging Signboards Grid */}
      <div className="pipeline-grid px-2">
        {stages.map((stage) => {
          const isActive = stage.id === currentStageId || stage.status === 'active';
          const isDone = stage.status === 'completed';

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage?.(stage.id)}
              className={`flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-1 ${
                isActive ? 'scale-102' : ''
              }`}
            >
              {/* Two Hanging Ropes */}
              <div className="w-full flex justify-around px-8 h-4">
                <div className="w-0.5 h-full bg-ink/70 border-r border-amber-300" />
                <div className="w-0.5 h-full bg-ink/70 border-r border-amber-300" />
              </div>

              {/* Wooden Hanging Board */}
              <div
                className={`w-full p-3 rounded-lg border-2 border-ink relative transition-all duration-300 ${
                  isActive
                    ? 'bg-sun-yellow text-ink shadow-md font-bold'
                    : isDone
                    ? 'bg-goa-green-700 text-paper shadow-sm'
                    : 'bg-sand text-ink shadow-sm opacity-85 hover:opacity-100'
                }`}
              >
                {/* Board Top Edge Screws */}
                <div className="absolute top-1.5 left-4 w-2 h-2 rounded-full border border-ink bg-stone-300" />
                <div className="absolute top-1.5 right-4 w-2 h-2 rounded-full border border-ink bg-stone-300" />

                {/* Step Pill */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border border-ink font-extrabold ${
                      isActive
                        ? 'bg-ink text-sun-yellow'
                        : isDone
                        ? 'bg-goa-green-500 text-paper'
                        : 'bg-paper text-ink'
                    }`}
                  >
                    STAGE {stage.stepNumber}
                  </span>

                  {isDone && (
                    <span className="text-xs bg-goa-green-500 text-paper px-1.5 py-0.2 rounded-full border border-ink font-bold">
                      ✓ DONE
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-mono font-black bg-hot-pink text-paper px-1.5 rounded-full border border-ink animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Stage Title in tall serif */}
                <h4 className="font-display text-lg leading-tight uppercase tracking-tight mt-1 mb-0.5">
                  {stage.title}
                </h4>

                {/* Stage Subtitle */}
                <p className="font-mono text-[11px] leading-tight opacity-80 uppercase tracking-wide">
                  {stage.subtitle}
                </p>

                {/* Tool call telemetry pill if recorded */}
                {typeof stage.toolCallsCount === 'number' && stage.toolCallsCount > 0 && (
                  <div className="mt-2 pt-1 border-t border-ink/20 flex items-center justify-between text-[10px] font-mono">
                    <span className="opacity-75">Tools executed:</span>
                    <span className="font-bold bg-paper/80 text-ink px-1 rounded border border-ink/40">
                      {stage.toolCallsCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
