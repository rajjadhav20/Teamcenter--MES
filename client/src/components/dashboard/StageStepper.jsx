import { STAGE_SEQUENCE, STAGE_META } from '../../utils/constants';

export default function StageStepper({ currentStage, status }) {
  const currentIdx = STAGE_SEQUENCE.indexOf(currentStage);
  const isFailed = status === 'FAILED';
  const isDone = status === 'SUCCESS';

  return (
    <div className="flex items-center" aria-label={`Current stage: ${currentStage}`}>
      {STAGE_SEQUENCE.map((stage, idx) => {
        const isCurrent = idx === currentIdx;
        const isActive = isCurrent && status === 'PROCESSING';
        const isPast = idx < currentIdx || isDone;

        let dotClass = 'border-base-600 bg-base-700';
        if (isFailed && isCurrent) dotClass = 'border-andon-failed bg-andon-failed';
        else if (isActive) dotClass = 'border-andon-processing bg-andon-processing animate-andon-pulse';
        else if (isPast) dotClass = 'border-andon-success bg-andon-success';

        return (
          <div key={stage} className="flex items-center" title={`${stage}: ${STAGE_META[stage]?.label}`}>
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${dotClass}`} />
            {idx < STAGE_SEQUENCE.length - 1 && <span className="h-px w-3 bg-base-700" />}
          </div>
        );
      })}
    </div>
  );
}
