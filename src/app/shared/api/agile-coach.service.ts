import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';
import { environment } from '../../../environments/environment';
import { getAccessToken } from '../lib/auth/cookie.helper';
import {
  AgileCoachSummaryResponse,
  AgileCoachChatRequest,
} from '../models/agile-coach.models';

@Injectable({
  providedIn: 'root',
})
export class AgileCoachService {
  async getSummary(taskItemId: string): Promise<AgileCoachSummaryResponse> {
    const response = await apiClient.get<any>(
      `/api/agile-coach/summary/${taskItemId}`
    );
    return response.data.data;
  }

  async regenerateSummary(
    taskItemId: string
  ): Promise<AgileCoachSummaryResponse> {
    const response = await apiClient.post<any>(
      `/api/agile-coach/summary/${taskItemId}/regenerate`
    );
    return response.data.data;
  }

  streamChat(
    request: AgileCoachChatRequest,
    onDelta: (token: string) => void,
    onDone: () => void,
    onError: (errorCode: string) => void
  ): () => void {
    const controller = new AbortController();

    const token = getAccessToken();
    const lang = localStorage.getItem('app_lang') ?? 'en';

    fetch(`${environment.apiUrl}/api/agile-coach/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        lang: lang,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          onError('STREAM_FAILED');
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isErrorEvent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete last line

          for (const line of lines) {
            if (line.startsWith('event: error')) {
              isErrorEvent = true;
              continue;
            }
            if (line.startsWith('event: done')) {
              onDone();
              return;
            }
            if (line.startsWith('data: ')) {
              const data = line.slice('data: '.length).trim();
              if (data === '[DONE]') {
                onDone();
                return;
              }
              if (isErrorEvent) {
                onError(data);
                isErrorEvent = false;
                return;
              }
              onDelta(data);
            }
          }
        }
        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') onError(err.message);
      });

    return () => controller.abort();
  }
}
