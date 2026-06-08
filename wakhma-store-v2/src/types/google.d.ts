export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void
          renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
          disableAutoSelect: () => void
          revoke: (hint: string, callback: (done: { successful: boolean; error?: string }) => void) => void
        }
      }
    }
  }
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  itp_support?: boolean
  log_level?: 'debug' | 'info' | 'warn' | 'error'
  nonce?: string
}

interface GoogleCredentialResponse {
  credential: string
  select_by: string
  clientId?: string
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  getMomentType: () => string
}

interface GoogleRenderButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
  click_listener?: () => void
}
