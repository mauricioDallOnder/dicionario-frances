# French Dictionary

This project is a French dictionary that allows users to search for word definitions and translate them into Portuguese.

## Features

- Search for French words and present their original definitions.
- Translate definitions into Portuguese.
- History of searched words with options to delete individual words or clear the entire history.

## Technologies Used

- React for the user interface.
- Material-UI for styling.
- Axios for HTTP requests.
- Flask as the server framework.
- Beautiful Soup for scraping definitions from Larousse.
- Google Cloud Translation API for translations.

## Installation and Execution

1. Clone the repository:

```bash
git clone https://github.com/your-username/french-dictionary.git
cd french-dictionary
# For the frontend
npm install
# For the backend (make sure to be in the Flask server folder)
pip install -r requirements.txt
# Run the Flask server and the Next.js client in parallel
npm run dev

