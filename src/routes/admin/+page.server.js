import { db } from '$lib/server/db';

export async function load(){
    const toIndex = (await db.query('SELECT * FROM toIndex LIMIT 25'))[0].result;
    if (toIndex) {
        return {
            toIndex
        };
    }
}

export const actions = {
    index: async ({ request }) => {
        const { url } = Object.fromEntries(await request.formData());
        db.create('toIndex', { url, createdAt: Date.now() });
    },
}