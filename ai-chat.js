// Configure an OpenAI-compatible provider. No backend or external libraries are needed.
const AI_CHAT_CONFIG = {
  // 🔑 INSERT YOUR API KEY HERE (leave empty until ready). WARNING: visible to anyone on a static site.
  apiKey: "",
  // 🤖 INSERT MODEL NAME HERE, e.g. "openai/gpt-4o-mini" (OpenRouter) or "llama-3.1-8b-instant" (Groq)
  model: "openai/gpt-4o-mini",
  // 🌐 INSERT ENDPOINT URL HERE (any OpenAI-compatible /chat/completions URL)
  // OpenRouter: https://openrouter.ai/api/v1/chat/completions
  // Groq: https://api.groq.com/openai/v1/chat/completions
  // Hugging Face: https://router.huggingface.co/v1/chat/completions
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  temperature: 0.4,
  maxTokens: 400,
  maxHistory: 10, // recent messages sent for context
  timeoutMs: 30000,
  welcomeMessage: "Hi! 👋 I'm the Avinash Times assistant. Ask me about our watches, clocks, services or contact details.",
};

(function () {
  'use strict';

  const SYSTEM_PROMPT = `You are the virtual assistant for Avinash Times.

Business Information:
- Shop Name: Avinash Times
- Business Type: Watches and Clocks Store
- Location: Ramanattukara, Kerala, India
- Contact Number: +91 8075353396
- Products: Watches, Clocks, Smart Watches, Wall Clocks
- Services: Watch Sales, Clock Sales, Watch Repairs, Battery Replacement
- Goal: Help visitors learn about the shop, products, services, contact details, and business information.

Only answer questions related to Avinash Times and the information provided.
If information is unavailable, politely ask the visitor to contact the shop.
Do not invent prices, brands, opening hours or stock availability. Keep answers short and friendly.`;

  document.addEventListener('DOMContentLoaded', function () {
    const launcher = document.getElementById('aic-launcher');
    const panel = document.getElementById('aic-panel');
    const close = document.getElementById('aic-close');
    const history = document.getElementById('aic-history');
    const form = document.getElementById('aic-form');
    const input = document.getElementById('aic-input');
    const send = document.getElementById('aic-send');
    const typing = document.getElementById('aic-typing');
    const conversation = [];
    let isOpen = false;
    let pending = false;

    /** Keep focus and accessibility state in sync, including during transitions. */
    function setOpen(open) {
      isOpen = open;
      launcher.setAttribute('aria-expanded', String(open));
      launcher.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
      panel.classList.toggle('aic-open', open);
      if (open) {
        (pending ? close : input).focus();
        history.scrollTop = history.scrollHeight;
      } else {
        launcher.focus();
      }
    }

    /** API and visitor text must always be rendered as text, never HTML. */
    function addMessage(role, text, error = false) {
      const message = document.createElement('p');
      message.className = 'aic-message aic-' + role + (error ? ' aic-error' : '');
      const label = document.createElement('span');
      label.className = 'aic-sr-only';
      label.textContent = role === 'user' ? 'You: ' : 'Assistant: ';
      const content = document.createElement('span');
      content.textContent = text;
      message.append(label, content);
      history.appendChild(message);
      history.scrollTop = history.scrollHeight;
    }

    launcher.addEventListener('click', function () { setOpen(!isOpen); });
    close.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (event) {
      if (isOpen && event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    });

    addMessage('assistant', AI_CHAT_CONFIG.welcomeMessage);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const question = input.value.trim();
      if (!question || pending || event.isComposing) return;

      addMessage('user', question);
      input.value = '';
      pending = true;
      input.disabled = true;
      send.disabled = true;
      typing.hidden = false;
      let timeout;
      let timedOut = false;
      let errorMessage = 'Sorry, the assistant could not reply. Please try again or call +91 8075353396.';

      try {
        if (!AI_CHAT_CONFIG.apiKey.trim() || !AI_CHAT_CONFIG.endpoint.trim()) {
          errorMessage = "The assistant isn't set up yet. Please call the shop on +91 8075353396 for help.";
          throw new Error('AI Chat API key or endpoint is not configured.');
        }

        const controller = new AbortController();
        timeout = window.setTimeout(function () {
          timedOut = true;
          controller.abort();
        }, AI_CHAT_CONFIG.timeoutMs);

        const headers = { 'Content-Type': 'application/json' };
        if (AI_CHAT_CONFIG.apiKey.trim()) {
          headers.Authorization = 'Bearer ' + AI_CHAT_CONFIG.apiKey.trim();
        }
        const historyLimit = Math.max(0, Math.floor(AI_CHAT_CONFIG.maxHistory));
        const recent = historyLimit ? conversation.slice(-historyLimit) : [];
        const response = await fetch(AI_CHAT_CONFIG.endpoint, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: AI_CHAT_CONFIG.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...recent,
              { role: 'user', content: question },
            ],
            temperature: AI_CHAT_CONFIG.temperature,
            max_tokens: AI_CHAT_CONFIG.maxTokens,
          }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            errorMessage = 'The assistant has a configuration issue. Please call the shop on +91 8075353396.';
          } else if (response.status === 429) {
            errorMessage = 'The assistant is busy right now. Please try again later or call +91 8075353396.';
          }
          throw new Error('AI Chat request failed with HTTP ' + response.status);
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        if (typeof answer !== 'string' || !answer.trim()) {
          throw new Error('AI Chat response did not contain a text answer.');
        }

        addMessage('assistant', answer);
        // Only successful exchanges belong in model context; welcome/errors stay local.
        conversation.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
        conversation.splice(0, Math.max(0, conversation.length - historyLimit));
      } catch (error) {
        if (timedOut) {
          errorMessage = 'The assistant took too long to reply. Please try again or call +91 8075353396.';
        }
        console.error('AI Chat:', error);
        addMessage('assistant', errorMessage, true);
      } finally {
        window.clearTimeout(timeout);
        pending = false;
        typing.hidden = true;
        input.disabled = false;
        send.disabled = false;
        if (isOpen) input.focus();
      }
    });
  });
})();
