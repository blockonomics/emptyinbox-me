import { createElement } from "../../../utils/domHelpers.js";
import { createMessagePreview } from "../../molecules/MessagePreview/index.js";
import { fetchMessages } from "../../../services/apiService.js";

export function createLatestMessageCard() {
  const card = createElement('div', 'stat-card');
  card.innerHTML = '<h3>Latest Message</h3>';
  
  const contentDiv = createElement('div', 'stat-text');
  contentDiv.id = 'latest-message-content';
  contentDiv.appendChild(createMessagePreview(null));
  
  card.appendChild(contentDiv);
  
  // Load latest message
  setTimeout(async () => {
    await loadLatestMessage(contentDiv);
  }, 0);
  
  return card;
}

async function loadLatestMessage(contentDiv) {
  try {
    const messages = await fetchMessages();
    const latestMessage = messages && messages.length > 0 ? messages[0] : null;
    const preview = createMessagePreview(latestMessage);
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(preview);
  } catch (error) {
    contentDiv.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Error loading messages</div>';
  }
}