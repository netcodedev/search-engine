import Surreal from 'surrealdb.js'
import lemmatizer from 'node-lemmatizer';

const db = new Surreal('http://10.0.0.4:8000/rpc');

await db.signin({
    user: 'root',
    pass: 'root'
});

await db.use('se', 'se');

export async function GET({ params }){
    let term = params.term.toLowerCase().split(" ");
    let searchTerms = [];
    for(let t of term){
        let lemmatized = lemmatizer.only_lemmas(t);
        if(lemmatized[lemmatized.length-1]){
            searchTerms = [...searchTerms, lemmatized[lemmatized.length-1]];
        }
    }
    let res = await db.query("SELECT * FROM indexedPage WHERE tokens CONTAINSANY $term LIMIT 25", {
        term: searchTerms
    });
    return new Response(JSON.stringify(res));
}