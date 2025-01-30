/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono';
const app = new Hono();

app.get('/', async (c) => {
	const question = c.req.query('text') || 'What is the square root of 9?';

	const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: question });
	const vectors = embeddings.data[0];

	const vectorQuery = await c.env.VECTOR_INDEX.query(vectors, { topK: 1 });

	let vecId;
	if (vectorQuery.matches && vectorQuery.matches.length > 0 && vectorQuery.matches[0]) {
		vecId = vectorQuery.matches[0].id;
	} else {
		console.log('No matching vector found or vectorQuery.matches is empty');
	}

	let notes = [];
	if (vecId) {
		const query = `SELECT * FROM notes WHERE id = ?`;
		const { results } = await c.env.DB.prepare(query).bind(vecId).all();
		console.log('results', results);
		if (results) notes = results.map((vec) => vec.text);
	}

	const contextMessage = notes.length ? `Context:\n${notes.map((note) => `- ${note}`).join('\n')}` : '';

	const systemPrompt = `When answering the question or responding, use the context provided, if it is provided and relevant.`;

	const { response: answer } = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
		messages: [
			...(notes.length ? [{ role: 'system', content: contextMessage }] : []),
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: question },
		],
	});

	return c.text(answer);
});

app.post('/notes', async (c) => {
	const { text } = await c.req.json();
	if (!text) {
		return c.text('Missing text', 400);
	}

	const { results } = await c.env.DB.prepare('INSERT INTO notes (text) VALUES (?) RETURNING *').bind(text).run();

	const record = results.length ? results[0] : null;

	if (!record) {
		return c.text('Failed to create note', 500);
	}

	const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
		text: [text],
	});
	const values = data[0];

	if (!values) {
		return c.text('Failed to generate vector embedding', 500);
	}

	const { id } = record;
	const inserted = await c.env.VECTOR_INDEX.upsert([
		{
			id: id.toString(),
			values,
		},
	]);

	return c.json({ id, text, inserted });
});

app.onError((err, c) => {
	return c.text(err);
});

export default app;
