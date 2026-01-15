import React from 'react';
import type { TPistonExecuteResponse } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

const OutputBlock = ({ title, content }: { title: string; content: string }) => {
  if (!content) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-slate-200">{title}</div>
      <pre className="whitespace-pre-wrap rounded-md bg-slate-950/60 p-3 text-xs text-slate-100">
        {content}
      </pre>
    </div>
  );
};

const PistonOutput = ({ result }: { result: TPistonExecuteResponse }) => {
  const localize = useLocalize();

  if (!result.ok) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase text-red-300">
          {localize('com_ui_error')}
        </div>
        <pre className="whitespace-pre-wrap rounded-md bg-red-950/30 p-3 text-xs text-red-100">
          {result.error}
          {result.details ? `\n${result.details}` : ''}
        </pre>
      </div>
    );
  }

  const output = result.run.stdout || result.run.output || '';
  const stderr = result.run.stderr || '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>
          {localize('com_ui_code_result')} • {result.language} {result.version}
        </span>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px]',
            result.run.code === 0
              ? 'border-emerald-400/40 text-emerald-200'
              : 'border-amber-400/40 text-amber-200',
          )}
        >
          {localize('com_ui_exit_code')}: {result.run.code ?? 'N/A'}
        </span>
      </div>
      <OutputBlock title={localize('com_ui_stdout')} content={output} />
      <OutputBlock title={localize('com_ui_stderr')} content={stderr} />
    </div>
  );
};

export default PistonOutput;
