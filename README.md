# avinashtimes
watches and clocks

Static website for **Avinash Times** – premium watches & clocks shop in Ramanattukara, Kerala, India (📞 8075353396).

## Structure
- `index.html` – page markup (header, hero, collection, contact footer)
- `css/style.css` – dark blue, black & gold theme, responsive layout and animations
- `js/main.js` – mobile menu, sticky header and scroll-reveal effects
- `ai-chat.js` / `ai-chat.css` – floating AI assistant and scoped widget styles

## AI Chat
The widget runs directly on GitHub Pages with no backend or external libraries.
Edit `AI_CHAT_CONFIG` at the top of `ai-chat.js` to set `apiKey`, `model`, and
`endpoint` for OpenRouter, Groq, Hugging Face's OpenAI-compatible router, or another
OpenAI-compatible `/chat/completions` API. Example endpoints are included there;
choose a model supported by your provider. The provider must allow browser
requests (CORS). You can also adjust response length, temperature, recent-message
context, timeout, and the welcome message. With an empty key or endpoint, visitors
see a friendly message directing them to call +91 8075353396.

**Security:** Any API key in `ai-chat.js` on a static GitHub Pages site is publicly
visible and can be copied and abused. Never commit a high-value key. If enabling
the widget, use a dedicated key with strict spending/rate limits (for example,
OpenRouter credit limits or a free-tier Groq key), monitor usage, and rotate it if
misused. A serverless proxy is the secure alternative if needed later; none is
included here. Messages and recent conversation context are sent to your chosen
provider; visitors should not share sensitive information.

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```
