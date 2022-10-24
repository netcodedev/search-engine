import Surreal from 'surrealdb.js'

const db = new Surreal('http://10.0.0.4:8000/rpc');

await db.signin({
    user: 'root',
    pass: 'root'
});

await db.use('se', 'se');

export async function GET({ params }){
    let id = params.id;
    let res = await db.query("DELETE $id", {
        id: id
    });
    return new Response(JSON.stringify(res));
}