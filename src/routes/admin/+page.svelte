<script>
    let indexUrl = "";
    let urls = new Set();
    let indexing = false;
    let autoIndexing = true;
    let indexingIndex = 0;
    let abortController;
    async function indexPage() {
        let res = await fetch('https://search.netcode.dev/index', {
            method: 'POST',
            body: JSON.stringify({
                url: indexUrl
            })
        });
    }
    function resetUrls(){
        urls = new Set();
    }
    async function loadAwaitingIndexing(){
        if(abortController)
			abortController.abort();
		abortController = new AbortController();
        await fetch('https://search.netcode.dev/awaitingIndexing/', {
			signal: abortController.signal,
		}).then(async response => {
			let res = await response.json();
			res[0].result.forEach(result => {
                urls.add(result);
            })
            urls = urls;
		}).catch(error => {
			//idgaf;
		})
    }
    async function indexUrls(){
        if(urls.size == 0){
            return;
        }
        indexing = true;
        let urlArray = Array.from(urls);
        for(let i in urlArray){
            indexingIndex = i;
            indexUrl = urlArray[i].url;
            await indexPage();
            fetch('https://search.netcode.dev/indexedId/'+urlArray[i].id.split(":")[1]);
        }
        resetUrls();
        indexing = false;
    }
    function cancelIndexing(){
        abortController.abort();
    }
    async function autoIndex(){
        autoIndexing = true;
        while(autoIndexing){
            await loadAwaitingIndexing().then(async ()=> await indexUrls());
        }
    }
    function stopAutoIndexing(){
        autoIndexing = false;
    }
    autoIndex();
</script>

<section id="index">
    <h2>Manually index a page</h2>
    <input type="url" style="width: 500px" bind:value={indexUrl}><button on:click={indexPage}>Index page</button>
    {#if urls.size > 0 && indexing}
        ({indexingIndex} of {urls.size}) <button on:click={cancelIndexing}>Cancel</button>
    {/if}
</section>
<section id="link-extraction">
    <h2>extract links</h2>
    <button on:click={loadAwaitingIndexing}>extract</button>
    <button on:click={autoIndex}>autoindex</button>
    <button on:click={resetUrls}>reset urls</button>
    {#if autoIndexing}
        <button on:click={stopAutoIndexing}>stop autoindexing</button>
    {/if}
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
</style>