<script>
    let searchTerm = "";

    let results = [];
    let resultsTime;

	let abortController;

    let indexedCount = 0;

    fetch("https://search.netcode.dev/index/amount").then(async data => {
        indexedCount = await data.text();
    }).catch(error => {});

    async function search(){
		if(searchTerm.trim().length == 0)
			return;
		if(abortController)
			abortController.abort();
		abortController = new AbortController();
        await fetch('search/'+searchTerm.trim(), {
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
            placeholder="{indexedCount} links are waiting to be indexed"
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
</style>