import { createCreateInboxButton } from "../../atoms/CreateInboxButton/index.js";
import { createInbox } from "../../../services/apiService.js";
import { ButtonStates } from "../../molecules/ButtonStates/index.js";

export function createInboxButtonWithLogic() {
  const button = createCreateInboxButton();
  button.id = 'create-inbox-btn';

  const originalContent = button.innerHTML;

  button.addEventListener('click', async () => {
    const loadingState = ButtonStates.loading('Creating...');
    button.innerHTML = loadingState.content;
    button.disabled = loadingState.disabled;

    try {
      const { response, success } = await createInbox();

      if (success) {
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

  return button;
}