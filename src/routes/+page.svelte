<script>
    let searchTerm = "";
    let indexUrl = "";

    let results = [];
    let resultsTime;

    let urls = new Set();
    let indexing = false;
    let indexingIndex = 0;

	let abortController;

    async function search(){
		searchTerm = searchTerm.trim();
		if(searchTerm.length == 0)
			return;
		if(abortController)
			abortController.abort();
		abortController = new AbortController();
        await fetch('search/'+searchTerm, {
			signal: abortController.signal,
		}).then(async response => {
			let res = await response.json();
			console.log(res[0]);
			results = res[0].result;
			resultsTime = res[0].time;
		}).catch(error => {
			//idgaf;
		})
    }
	
	$: {
		searchTerm;
		search();
	}

    async function indexPage() {
        let res = await fetch('index', {
            method: 'POST',
            body: JSON.stringify({
                url: indexUrl
            })
        });
    }
    async function extractLinks(){
        let res = await fetch('search/all');
        let resJson = await res.json();
        console.log(resJson);
        let aTagRegex = /<a([^>]+)>(.+?)<\/a>/gmi;
        let linksRegex = /\s*href\s*=\s*(\"([^"]*)\"|'[^']*'|([^'">\s]+))/gmi
        for(let result of resJson[0].result){
            let domain = domainFromUrl(result.url);
            if(result.rawBody){
                let aTags;
                while((aTags = aTagRegex.exec(result.rawBody)) != null){
                    for(let aTag of aTags){
                        let match = linksRegex.exec(aTag);
                        if(match && match[2]){
                            if(!match[2].startsWith("#")){
                                if(!match[2].startsWith("http://") && !match[2].startsWith("https://")){
                                    let url = domain+(match[2].startsWith("/")?'':'/')+match[2];
                                    urls.add(url);
                                }
                            }
                            if(match[2].startsWith("http://") || match[2].startsWith("https://")){
                                urls.add(match[2]);
                            }
                        }
                    }
                }
            }
        }
        urls = urls;
    }
    async function indexUrls(){
        if(urls.size == 0){
            return;
        }
        console.log("starting indexing");
        indexing = true;
        let urlArray = Array.from(urls);
        for(let i in urlArray){
            indexingIndex = i;
            indexUrl = urlArray[i];
            await indexPage();
        }
        console.log("done");
        resetUrls();
        indexing = false;
    }
    function resetUrls(){
        urls = new Set();
    }
    function domainFromUrl(data) {
        var a = document.createElement('a');
        a.href = data;
        return `${a.protocol}//${a.hostname}`;
    }
    function decodeHTMLEntities(text) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
</script>

<section id="search">
    <h1>netcodes search engine</h1>
    <form class="search-bar" on:submit|preventDefault={search}>
        <input 
            type="search"
            placeholder="Search for things and pray to god (me) to get an answer"
            bind:value={searchTerm}
            ><button class="material-icons" type="submit" title="search">search</button>
    </form>
    {#if results.length > 0}
        <h2>{results.length} results in {resultsTime}</h2>
    {:else if searchTerm.trim().length > 0}
        <h2>No results</h2>
    {/if}
    {#each results as result}
    <div class="search-result">
        <a href={result.url} class="title">{decodeHTMLEntities(result.title)}</a>
        <a href={result.url}>{result.url}</a>
    </div>
    {/each}
</section>
<section id="index">
    <h2>Manually index a page</h2>
    <input type="url" bind:value={indexUrl}><button on:click={indexPage}>Index page</button>
    {#if urls.size > 0 && indexing}
        ({indexingIndex} of {urls.size})
    {/if}
</section>
<section id="link-extraction">
    <h2>extract links</h2>
    <button on:click={extractLinks}>extract</button>
    <button on:click={resetUrls}>reset urls</button>
    {#if urls.size > 0}
        <span>Extracted {urls.size} URLs</span>
        <button on:click={indexUrls}>Index all</button>
    {/if}
</section>


<style lang="scss">
    :global(body) {
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        margin: 0px;
        padding: 0px;
        background-color: #222;
        color: #999;
    }
    #search {
        display: flex;
        align-items: center;
        flex-direction: column;
        min-height: calc(100vh - 200px);
        h1 {
            color: #427FED;
            font-size: 3em;
            text-align: center;
        }
        .search-bar{
            display: flex;
            &:hover, &:focus-within {
                input, button {
                    border-color: #427FED !important;
                }
            }
            input[type="search"]{
                padding: 10px 25px;
                border: 1px solid #AAA;
                border-right-width: 0px;
                border-radius: 50px 0px 0px 50px;
                font-size: 1em;
                height: 60px;
                outline: none;
                vertical-align: middle;
                width: 500px;
                + button {
                    background-color: white;
                    border: 1px solid #AAA;
                    border-left-width: 0px;
                    border-radius: 0px 50px 50px 0px;
                    cursor: pointer;
                    font-size: 2em;
                    height: 60px;
                    padding: 10px;
                    vertical-align: middle;
                    &:hover{
                        color: #427FED;
                    }
                }
            }
        }
        .search-result {
            background-color: #333;
            border-radius: 10px;
            padding: 10px;
            margin: 5px;
            width: 60%;
            a {
                color: #439716;
                &.title{
                    color: #427fed;
                    font-size: 1.5em;
                    display: block;
                    text-decoration: none;
                }
            }
        }
    }
    #index {
        input {
            width: 200px;
        }
    }
</style>