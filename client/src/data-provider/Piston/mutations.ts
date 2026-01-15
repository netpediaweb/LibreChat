import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService, Tools } from 'librechat-data-provider';
import type { TPistonExecuteRequest, TPistonExecuteResponse, ToolCallResults } from 'librechat-data-provider';

export type TPistonExecutePayload = TPistonExecuteRequest & {
  messageId: string;
  partIndex?: number;
  blockIndex?: number;
  conversationId: string;
};

export const usePistonExecuteMutation = () => {
  const queryClient = useQueryClient();

  const updateToolCalls = (payload: TPistonExecutePayload, result: TPistonExecuteResponse) => {
    queryClient.setQueryData<ToolCallResults>(
      [QueryKeys.toolCalls, payload.conversationId],
      (prev) => [
        ...(prev ?? []),
        {
          user: '',
          toolId: Tools.execute_code,
          partIndex: payload.partIndex,
          messageId: payload.messageId,
          blockIndex: payload.blockIndex,
          conversationId: payload.conversationId,
          result,
          attachments: [],
        },
      ],
    );
  };

  return useMutation(
    (payload: TPistonExecutePayload) => {
      const { language, version, code, stdin } = payload;
      return dataService.executePiston({ language, version, code, stdin });
    },
    {
      onSuccess: (response, payload) => {
        updateToolCalls(payload, response);
      },
      onError: (error: unknown, payload) => {
        const responseData = (error as { response?: { data?: TPistonExecuteResponse } })?.response
          ?.data;
        const fallbackResponse: TPistonExecuteResponse = responseData ?? {
          ok: false,
          error: (error as Error)?.message ?? 'Failed to execute code',
        };
        updateToolCalls(payload, fallbackResponse);
      },
    },
  );
};
