<script>
	import { enhance } from '$app/forms';

	export let data;
</script>

<form action="?/index" method="POST" use:enhance>
	<input type="text" name="url" id="url" />
	<input type="submit" value="Index page" />
</form>

{#each data.toIndex as ti}
	<span>{ti.url}</span>
{/each}
