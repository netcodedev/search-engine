<script>
	export let data;
</script>

<div>
	{#each data.pages as page}
		<a href={page.url}>{page.title}</a><br />
	{/each}
</div>
