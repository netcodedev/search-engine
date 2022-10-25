import Surreal from 'surrealdb.js';
import jsTokens from 'js-tokens';
import lemmatizer from 'node-lemmatizer';
import cheerio from 'cheerio';

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
        fetch(indexUrl, {compress: false})
            .then(res => {
                if(res.ok){
                    res.text().then(body => {
                        if(!body.toLowerCase().startsWith("<!doctype html")){
                            return new Response(String("excluded data"));
                        }
                        const document = cheerio.load(body);
                        const title = document('title').text();
                        const docBody = document('body');
            
                        let tokens = [];
                        for(let token of jsTokens(docBody.text())){
                            if(token.value != ' ' && !tokens.includes(token.value)){
                                let lemmatized = lemmatizer.only_lemmas(token.value.toLowerCase());
                                if(lemmatized[lemmatized.length-1]){
                                    tokens = [...tokens, lemmatized[lemmatized.length-1]];
                                }
                            }
                        }
            
                        db.create("indexedPage", {
                            url: indexUrl,
                            tokens: tokens,
                            title: title,
                            time: Date.now(),
                        });
            
                        let urls = new Set();
                        document('body a').each((i,el)=>{
                            const link = document(el).attr('href');
                            if(!link)
                                return;
                            if(link.startsWith("#"))
                                return;
                            if(link.startsWith("ftp://"))
                                return
                            if(!link.startsWith("http://") && !link.startsWith("https://")){
                                let url = indexUrl+((link.startsWith("/")||indexUrl.endsWith("/"))?'':'/')+link;
                                urls.add(url);
                            }
                            if(link.startsWith("http://") || link.startsWith("https://")){
                                urls.add(link);
                            }
                        })
            
                        urls = Array.from(urls);
                        urls.forEach(async url => {
                            let existing = await db.query("SELECT url FROM awaitingIndexing WHERE url = $url", {
                                url: indexUrl
                            });
                            if(existing[0].result.length == 0){
                                await db.create("awaitingIndexing", {
                                    url: url,
                                    date: Date.now()
                                });
                            }
                            
                        });
            
                        return new Response(JSON.stringify(tokens));
                    });
                }
            })
            .catch(error => console.error(indexUrl, error.message));
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