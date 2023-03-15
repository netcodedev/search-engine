import lemmatizer from 'node-lemmatizer';
import { db } from '$lib/server/db';

export async function GET({ params }){
    let term = params.term.toLowerCase().split(" ");
    let searchTerms = [];
    for(let t of term){
        let lemmatized = lemmatizer.only_lemmas(t);
        if(lemmatized[lemmatized.length-1]){
            searchTerms = [...searchTerms, lemmatized[lemmatized.length-1]];
        }
    }
    let res = await db.query("SELECT * FROM indexedPage WHERE url CONTAINS $term OR tokens CONTAINSANY $term LIMIT 25", {
        term: searchTerms
    });
    return new Response(JSON.stringify(res));
}