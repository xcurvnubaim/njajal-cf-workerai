# RAG AI Tutorial

## Description

This project is a tutorial for building a Retrieval-Augmented Generation (RAG) AI using Cloudflare Workers. The worker uses embeddings to find relevant context from a vector index and then generates a response using a language model.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/xcurvnubaim/njajal-cf-workerai.git
   cd njajal-cf-workerai
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

## Usage

### Running the Development Server

To start the development server, run:
```sh
npm run dev
```
This will start the worker on `http://localhost:8787`.

### Deploying the Worker

To deploy the worker, run:
```sh
npm run deploy
```

### Example Request

To use the worker, you can make a GET request to the root endpoint with a query parameter `text`:
```sh
curl "http://localhost:8787/?text=What%20is%20the%20square%20root%20of%209%3F"
```

## License

This project is licensed under the MIT License.
