declare namespace google {
  namespace accounts {
    namespace id {
      function initialize(config: InitializeConfig): void;
      function prompt(callback?: (notification: PromptMomentNotification) => void): void;
      function renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
      function disableAutoSelect(): void;

      interface InitializeConfig {
        client_id: string;
        callback: (credentialResponse: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }

      interface CredentialResponse {
        credential: string; // The ID Token
        select_by: string;
      }

      interface PromptMomentNotification {
        isDisplayMoment(): boolean;
        isDisplayed(): boolean;
        isNotDisplayed(): boolean;
        getNotDisplayedReason(): string;
        isSkippedMoment(): boolean;
        getSkippedReason(): string;
        isDismissedMoment(): boolean;
        getDismissedReason(): string;
      }

      interface GsiButtonConfiguration {
        type?: 'standard' | 'icon';
        theme?: 'outline' | 'filled_blue' | 'filled_black';
        size?: 'large' | 'medium' | 'small';
        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        shape?: 'rectangular' | 'pill' | 'circle' | 'square';
        logo_alignment?: 'left' | 'center';
        width?: number;
        locale?: string;
      }
    }
  }
}
