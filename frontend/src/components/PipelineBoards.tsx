import React from 'react';
import { BambooPole, type PipelineStage } from '../art/BambooPole';

interface PipelineBoardsProps {
  currentStage?: '01' | '02' | '03' | '04' | string;
  onSelectStage?: (stageId: string) => void;
  toolCallsCount?: number;
  className?: string;
}

export const PipelineBoards: React.FC<PipelineBoardsProps> = ({
  currentStage = '02',
  onSelectStage,
  toolCallsCount = 4,
  className = '',
}) => {
  const stages: PipelineStage[] = [
    {
      id: '01',
      stepNumber: '01',
      title: 'TRIGGER',
      subtitle: 'Where it all begins',
      status: currentStage === '01' ? 'active' : 'completed',
    },
    {
      id: '02',
      stepNumber: '02',
      title: 'INVESTIGATE',
      subtitle: 'Trace the network',
      status:
        currentStage === '02'
          ? 'active'
          : ['03', '04'].includes(currentStage)
          ? 'completed'
          : 'pending',
      toolCallsCount,
    },
    {
      id: '03',
      stepNumber: '03',
      title: 'ASSESS',
      subtitle: 'How sure are we?',
      status:
        currentStage === '03'
          ? 'active'
          : currentStage === '04'
          ? 'completed'
          : 'pending',
    },
    {
      id: '04',
      stepNumber: '04',
      title: 'ACT',
      subtitle: 'The world watches',
      status: currentStage === '04' ? 'active' : 'pending',
    },
  ];

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 select-none ${className}`}>
      {/* Title Tag */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase tracking-widest px-3 py-1 rounded border-2 border-ink bg-sun-yellow text-ink shadow-xs">
            PIPELINE RHYTHM // 4 STAGES
          </span>
          <span className="font-mono text-xs text-goa-green-200 uppercase hidden sm:inline">
            4 stages. One rhythm. Everything intentional.
          </span>
        </div>
      </div>

      {/* The Bamboo Pole with 4 Hanging Signboards */}
      <BambooPole
        stages={stages}
        currentStageId={currentStage}
        onSelectStage={onSelectStage}
      />
    </div>
  );
};
