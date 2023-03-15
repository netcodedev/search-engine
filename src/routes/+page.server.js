import { db } from '$lib/server/db';

export async function load(){
	let pages = (await db.query('SELECT * FROM indexedPage ORDER BY createdAt DESC LIMIT 25'))[0].result;
	return {
		pages
	};
}