# Android Agent

Android Agent is a Node.js-based AI assistant server that leverages Google Gemini and OpenWeather APIs to help users perform actions on their Android phone and answer general queries. It can make phone calls, send WhatsApp messages, fetch weather info, control the flashlight, manage contacts, and more.

## Features

- **Conversational AI**: Uses Google Gemini for natural language understanding and response.
- **Phone Actions**: Supports making calls, sending WhatsApp messages, controlling the flashlight, taking selfies, and more.
- **Weather Info**: Fetches current weather using OpenWeather API.
- **Contact Management**: Retrieves and searches contacts.
- **Memory**: Maintains conversation history in `history.json`.
- **Extensible Tools**: Easily add new phone actions via `toolsDeclaration.js` and `actualTools.js`.

## Project Structure

```
.
├── actualTools.js         # Implements tool functions (weather, time, etc.)
├── history.json           # Stores conversation history
├── index.js               # Main Express server and AI agent logic
├── memory.js              # Handles reading/writing conversation history
├── package.json           # Project dependencies and scripts
├── toolsDeclaration.js    # Declares available tools for the AI
├── .gitignore
```

## Getting Started

### Prerequisites

- Node.js v18+
- API keys for:
  - Google Gemini (`GEMINI_API_KEY`)
  - OpenWeather (`OPENWEATHER_API_KEY`)

### Installation

1. Clone the repository:

   ```sh
   git clone <repo-url>
   cd android-agent
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   GEMINI_API_KEY=your_google_gemini_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   ```

### Running the Server

Start the server with:

```sh
npm start
```

The server will run at [http://localhost:3000](http://localhost:3000).

### API Usage

Send a POST request to `/api/v1/gemini-agent` with a JSON body:

```json
{
  "prompt": "Call mom"
}
```

The AI will respond with either a direct answer or trigger the appropriate tool.

## Customization

- **Add new tools**:

  - Declare in [`toolsDeclaration.js`](toolsDeclaration.js)
  - Implement in [`actualTools.js`](actualTools.js)

- **Conversation Memory**:
  - Stored in [`history.json`](history.json)
  - Managed by [`memory.js`](memory.js)

## License

ISC

## Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [OpenWeather API](https://openweathermap.org/api)
