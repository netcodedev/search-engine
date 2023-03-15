import lemmatizer from 'node-lemmatizer';
import { db } from '$lib/server/db';

export async function GET({ url }){
    let term = url.searchParams.get('query').split(' ');
    let searchTerms = [];
    for(let t of term){
        let lemmatized = lemmatizer.only_lemmas(t);
        if(lemmatized[lemmatized.length-1]){
            searchTerms = [...searchTerms, lemmatized[lemmatized.length-1]];
        }
    }
    let count = await db.query("SELECT id FROM indexedPage WHERE url CONTAINS $term OR tokens CONTAINSANY $term", {
        term: searchTerms
    });
    console.log(count[0].result.length)
    let res = await db.query("SELECT url, title FROM indexedPage WHERE url CONTAINS $term OR tokens CONTAINSANY $term LIMIT 25", {
        term: searchTerms
    });
    return new Response(JSON.stringify({ count: count[0].result.length, result: res[0] }));
}