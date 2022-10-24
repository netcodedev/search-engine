import Surreal from 'surrealdb.js'
import jsTokens from 'js-tokens'
import lemmatizer from 'node-lemmatizer';

const db = new Surreal('http://10.0.0.4:8000/rpc');

await db.signin({
    user: 'root',
    pass: 'root'
});

await db.use('se', 'se');

export async function POST(request){
    let indexUrl;
    let urlPattern = /^http/gi;
    let params = await request.request.json();
    if(!params.url)
        return;
    if(!urlPattern.test(params.url)){
        indexUrl = 'https://'+params.url;
    } else {
        indexUrl = params.url;
    }
    let existing = await db.query("SELECT url FROM indexedPage WHERE url = $url", {
        url: indexUrl
    });
    if(existing[0].result.length > 0){
        return new Response(String("already Indexed"));
    }
    if(indexUrl.includes("web.archive.org") || indexUrl.includes("wikipedia.org") || indexUrl.includes("wikimedia.org")){
        return new Response(String("excluded url"));
    }
    if(isValidHttpUrl(indexUrl)){
        const res = await fetch(indexUrl);
        if(res.ok){
            let body = await res.text();
            let rawBody = body;

            let title = /<title[^>]*>([\s\S]*?)<\/title>/g.exec(body);
            if(!title)
                return new Response(String("failed: no title"));
            title = title[1];

            body = body.replace(/<head[^>]*>[\s\S]*<\/head>/g, "");
            body = body.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, "");
            body = body.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, "");
            body = body.replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g, "");

            body = body.replace(/[\s][\s]+/g, " ");
            let tagsRegex = /<[/!-]?[A-Za-z0-9]+([\s]+[a-zA-Z0-9-]*(=[\s]*(("([^"]*|[\r\n]*)")|('([^']*|[\r\n]*)'))[ ]*)?)*[ ]?[/]?>/gm;
            body = body.replace(tagsRegex, "");

            body = body.replace(/[\s][\s]+/g, " ");
            let tagsRegex2 = /<[/!-]?[A-Za-z0-9]+([\s]+[a-zA-Z0-9-]*(=[\s]*(("([^"]*|[\r\n]*)")|('([^']*|[\r\n]*)')|([^ ]*))[ ]*)?)*[ ]?[/]?>/gm;
            body = body.replace(tagsRegex2, "");

            body = body.replace(/[\s][\s]+/g, " ");
            body = body.replaceAll("&amp;","&");
            body = body.replace(/&[a-zA-Z0-9]+/g,"");
            body = body.replace(/<!--[^]*-->/g,"");
            body = body.replace(/&#[a-zA-Z0-9]*;/g,"");

            let tokens = [];
            for(let token of jsTokens(body)){
                if(token.value != ' ' && !tokens.includes(token.value)){
                    let lemmatized = lemmatizer.only_lemmas(token.value.toLowerCase());
                    if(lemmatized[lemmatized.length-1]){
                        tokens = [...tokens, lemmatized[lemmatized.length-1]];
                    }
                }
            }

            await db.create("indexedPage", {
                url: indexUrl,
                //rawBody: rawBody,
                tokens: tokens,
                title: title,
                time: Date.now(),
            });

            let aTagRegex = /<a([^>]+)>(.+?)<\/a>/gmi;
            let linksRegex = /\s*href\s*=\s*(\"([^"]*)\"|'[^']*'|([^'">\s]+))/gmi
            let aTags;
            let urls = new Set();
            while((aTags = aTagRegex.exec(rawBody)) != null){
                for(let aTag of aTags){
                    let match = linksRegex.exec(aTag);
                    if(match && match[2]){
                        if(!match[2].startsWith("#")){
                            if(!match[2].startsWith("http://") && !match[2].startsWith("https://")){
                                let url = indexUrl+(match[2].startsWith("/"||indexUrl.endsWith("/"))?'':'/')+match[2];
                                urls.add(url);
                            }
                        }
                        if(match[2].startsWith("http://") || match[2].startsWith("https://")){
                            urls.add(match[2]);
                        }
                    }
                }
            }
            urls = Array.from(urls);
            urls.forEach(async url => {
                await db.create("awaitingIndexing", {
                    url: url
                });
            });

            return new Response(JSON.stringify(tokens));
        }
    }
    return new Response(String("failed"));
}

/**
 * @param {string | URL} string
 */
function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}