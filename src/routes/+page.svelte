<script>
	let query = '';

	let results = {};
	async function search() {
		const data = await fetch(`/search?query=${query}`);
		results = await data.json();
	}
</script>

<div class="m-5">
	<div class="flex gap-2 justify-center my-10 flex-col w-full">
		<div class="m-auto">
			<form class="input-group">
				<input
					class="input input-bordered bg-base-300 focus:outline-none border-primary w-80"
					type="search"
					bind:value={query}
				/>
				<button class="btn btn-primary" on:click={search}>Search</button>
			</form>
		</div>
		<div class="m-auto">
			{#if results.result?.status == 'OK'}
				Found {results.count} results in {results.result.time}
			{/if}
		</div>
	</div>
	<div class="flex flex-col gap-3">
		{#if results.result?.status == 'OK'}
			{#each results.result.result as result}
				<div class="card card-compact bg-base-200 w-3/5 m-auto">
					<div class="card-body">
						<h3 class="text-primary text-2xl whitespace-nowrap overflow-ellipsis overflow-hidden">
							{result.title}
						</h3>
						<a class="link link-success underline text-md" href={result.url}>{result.url}</a>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
