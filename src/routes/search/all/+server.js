import Surreal from 'surrealdb.js'

const db = new Surreal('http://10.0.0.4:8000/rpc');

await db.signin({
    user: 'root',
    pass: 'root'
});

await db.use('se', 'se');

export async function GET(){
    let res = await db.query("SELECT * FROM indexedPage");
    console.log(res);
    return new Response(JSON.stringify(res));
}