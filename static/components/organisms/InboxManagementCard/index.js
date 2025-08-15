import { createElement } from "../../../utils/domHelpers.js";
import { createInboxList } from "../../molecules/InboxList/index.js";
import { createCreateInboxButton } from "../../atoms/CreateInboxButton/index.js";
import { fetchInboxes, createInbox } from "../../../services/apiService.js";
import { ButtonStates } from "../../molecules/ButtonStates/index.js";

export function createInboxManagementCard() {
  const card = createElement('div', 'stat-card');
  card.innerHTML = `
    <h3>Email Inboxes</h3>
    <div id="inbox-list" class="stat-text" style="margin-bottom: 1rem;">
      <div style="color: #6b7280; font-size: 0.9rem;">Loading inboxes...</div>
    </div>
  `;
  
  const createButton = createCreateInboxButton();
  createButton.id = 'create-inbox-btn';
  card.appendChild(createButton);
  
  // Load inboxes and setup button
  setTimeout(() => {
    loadInboxes();
    setupCreateInboxHandler(createButton);
  }, 0);
  
  return card;
}

async function loadInboxes() {
  const listDiv = document.getElementById('inbox-list');
  
  try {
    const inboxes = await fetchInboxes();
    const inboxList = createInboxList(inboxes);
    
    listDiv.innerHTML = '';
    listDiv.appendChild(inboxList);
  } catch (error) {
    listDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading inboxes</div>';
  }
}

function setupCreateInboxHandler(button) {
  const originalContent = button.innerHTML;
  
  button.addEventListener('click', async () => {
    // Set loading state
    const loadingState = ButtonStates.loading('Creating...');
    button.innerHTML = loadingState.content;
    button.disabled = loadingState.disabled;
    
    try {
      const { response, success } = await createInbox();
      
      if (success) {
        // Refresh inbox list
        await loadInboxes();
        
        // Show success state
        const successState = ButtonStates.success('Created!');
        button.innerHTML = successState.content;
        button.style.background = successState.background;
        
        setTimeout(() => {
          const defaultState = ButtonStates.default(originalContent);
          button.innerHTML = defaultState.content;
          button.style.background = defaultState.background;
          button.disabled = defaultState.disabled;
        }, 2000);
        
      } else if (response.status === 403) {
        const errorState = ButtonStates.error('Quota Exceeded');
        button.innerHTML = errorState.content;
        button.style.background = errorState.background;
        
        setTimeout(() => {
          const defaultState = ButtonStates.default(originalContent);
          button.innerHTML = defaultState.content;
          button.style.background = defaultState.background;
          button.disabled = defaultState.disabled;
        }, 3000);
      } else {
        throw new Error('Failed to create inbox');
      }
    } catch (error) {
      const errorState = ButtonStates.error('Error');
      button.innerHTML = errorState.content;
      button.style.background = errorState.background;
      
      setTimeout(() => {
        const defaultState = ButtonStates.default(originalContent);
        button.innerHTML = defaultState.content;
        button.style.background = defaultState.background;
        button.disabled = defaultState.disabled;
      }, 3000);
    }
  });
}