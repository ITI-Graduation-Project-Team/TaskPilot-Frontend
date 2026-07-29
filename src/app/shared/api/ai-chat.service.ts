import { Injectable, inject } from '@angular/core';
import { apiClient } from './axios.instance';
import { ProjectStateService } from '../services/project-state.service';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private projectState = inject(ProjectStateService);

  constructor() { }

  /**
   * Method to ask questions about company policies using the real API endpoint.
   */
  async askPolicyQuestion(question: string): Promise<{ succeeded: boolean; data?: string; message?: string }> {
    try {
      const companyId = this.projectState.userCompanyId();
      
      if (!companyId) {
        return {
          succeeded: false,
          message: 'Company ID not found.'
        };
      }

      const response = await apiClient.post<any>(
        '/company-policies/ask',
        { companyId, question }
      );
      
      const resData = response.data;
      let answerText = '';
      
      if (resData?.data?.answer) {
        answerText = resData.data.answer;
      } else if (resData?.answer) {
        answerText = resData.answer;
      } else if (resData?.Data?.Answer) {
        answerText = resData.Data.Answer;
      }

      return {
        succeeded: resData?.succeeded ?? true,
        data: answerText,
        message: resData?.message
      };
    } catch (error: any) {
      console.error('Error asking policy question:', error);
      return {
        succeeded: false,
        message: error?.response?.data?.message || 'An error occurred while fetching the answer.'
      };
    }
  }
}
