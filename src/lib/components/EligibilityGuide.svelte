<script lang="ts">
	import { ArrowUpRight, CircleCheck, ListChecks } from '@lucide/svelte';

	let {
		country,
		degreeLevels,
		fieldsOfStudy,
		sourceUrl
	}: {
		country: string;
		degreeLevels: string;
		fieldsOfStudy: string | null;
		sourceUrl: string | null;
	} = $props();

	const checks = $derived([
		{ label: `My current study level matches: ${degreeLevels}.` },
		{ label: `I meet the provider's nationality and residency rules for study in ${country}.` },
		{
			label: fieldsOfStudy
				? `My intended subject is included in: ${fieldsOfStudy}.`
				: 'My intended subject is eligible according to the provider.'
		},
		{ label: 'I have checked any grade, age, experience, or financial-need requirements.' },
		{ label: 'I checked the current application window and can prepare the required documents.' }
	]);

	let checked = $state<Record<number, boolean>>({});
	const completed = $derived(Object.values(checked).filter(Boolean).length);
</script>

<section class="eligibility-guide" aria-labelledby="eligibility-guide-title">
	<div class="guide-heading">
		<span class="guide-icon"><ListChecks size={17} /></span>
		<div>
			<h3 id="eligibility-guide-title">Am I eligible?</h3>
			<p>Use this quick checklist to compare your situation with the provider’s rules.</p>
		</div>
	</div>
	<div class="progress-row" aria-live="polite">
		<span>{completed} of {checks.length} checks marked</span>
		<div class="progress-track" role="progressbar" aria-label="Eligibility checklist progress" aria-valuemin="0" aria-valuemax={checks.length} aria-valuenow={completed}>
			<span style={`width:${(completed / checks.length) * 100}%`}></span>
		</div>
	</div>
	<ul>
		{#each checks as check, index}
			<li>
				<label>
					<input type="checkbox" checked={checked[index] ?? false} onchange={(event) => (checked[index] = event.currentTarget.checked)} />
					<span>{check.label}</span>
				</label>
			</li>
		{/each}
	</ul>
	<div class="guide-note">
		<CircleCheck size={15} />
		<p>This checklist is guidance, not an eligibility decision. Confirm every requirement and the latest deadline with the scholarship provider.</p>
	</div>
	{#if sourceUrl}
		<a class="guide-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">Check the official eligibility rules <ArrowUpRight size={14} /></a>
	{/if}
</section>

<style>
	.eligibility-guide{margin-top:15px;padding:17px;background:#f5f9fc;border:1px solid #e1eaf1;border-radius:9px}.guide-heading{display:flex;align-items:flex-start;gap:10px}.guide-icon{width:30px;height:30px;display:grid;place-items:center;flex:none;color:#2d6d61;background:#e6f3ee;border-radius:8px}.guide-heading h3{font:700 13px Manrope,sans-serif;color:#23425e;margin:1px 0 4px}.guide-heading p{font-size:10px;line-height:1.6;color:#718195;margin:0}.progress-row{display:flex;align-items:center;gap:12px;margin:15px 0 11px;color:#718195;font-size:9px}.progress-track{height:5px;flex:1;overflow:hidden;background:#e4ebf0;border-radius:99px}.progress-track span{display:block;height:100%;background:#54a27e;border-radius:inherit;transition:width .15s ease}.eligibility-guide ul{list-style:none;padding:0;margin:0;display:grid;gap:9px}.eligibility-guide li label{display:flex;align-items:flex-start;gap:9px;color:#53697e;font-size:10px;line-height:1.6;cursor:pointer}.eligibility-guide input{margin:2px 0 0;accent-color:#34795d;flex:none}.guide-note{display:flex;align-items:flex-start;gap:7px;margin-top:14px;padding-top:12px;border-top:1px solid #e5edf2;color:#548371}.guide-note svg{flex:none;margin-top:1px}.guide-note p{margin:0;color:#718477;font-size:9px;line-height:1.65}.guide-link{display:inline-flex;align-items:center;gap:4px;margin-top:11px;color:#347254;font-size:9px;font-weight:700}.guide-link:hover{text-decoration:underline}
	@media(prefers-reduced-motion:reduce){.progress-track span{transition:none}}
</style>
