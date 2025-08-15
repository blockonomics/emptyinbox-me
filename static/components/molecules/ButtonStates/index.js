export const ButtonStates = {
  loading: (text = 'Loading...') => ({
    content: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      ${text}
    `,
    disabled: true
  }),
  
  success: (text = 'Success!') => ({
    content: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      ${text}
    `,
    background: 'linear-gradient(135deg, #10b981, #059669)'
  }),
  
  error: (text = 'Error') => ({
    content: text,
    background: 'linear-gradient(135deg, #ef4444, #dc2626)'
  }),
  
  default: (content) => ({
    content,
    background: '',
    disabled: false
  })
};