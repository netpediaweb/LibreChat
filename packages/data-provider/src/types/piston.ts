export type TPistonExecuteRequest = {
  language: string;
  version?: string;
  code: string;
  stdin?: string;
};

export type TPistonRunResult = {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
};

export type TPistonExecuteSuccess = {
  ok: true;
  language: string;
  version: string;
  run: TPistonRunResult;
  raw?: unknown;
};

export type TPistonExecuteError = {
  ok: false;
  error: string;
  details?: string;
};

export type TPistonExecuteResponse = TPistonExecuteSuccess | TPistonExecuteError;

export type TPistonRuntimesResponse =
  | { ok: true; runtimes: unknown }
  | { ok: false; error: string; details?: string };
