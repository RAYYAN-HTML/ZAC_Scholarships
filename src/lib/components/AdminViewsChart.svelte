<script lang="ts">
	type ViewDay = { date: string; views: number };
	let { days }: { days: ViewDay[] } = $props();
	const maxViews = $derived(Math.max(1, ...days.map((day) => day.views)));
	const hasViews = $derived(days.some((day) => day.views > 0));
	const number = (value: number) => new Intl.NumberFormat('en-PK').format(value);
	const dateLabel = (value: string) => new Date(`${value}T12:00:00+05:00`).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' });
	const dayName = (value: string) => new Date(`${value}T12:00:00+05:00`).toLocaleDateString('en-PK', { weekday: 'short' });
	const height = (value: number) => value === 0 ? '0%' : `${Math.max(4, (value / maxViews) * 100)}%`;
</script>

<figure class="views-chart">
	<figcaption><span>Daily views</span><span>Last 14 days</span></figcaption>
	{#if hasViews}
		<div class="chart-layout">
			<div class="scale" aria-hidden="true"><span>{number(maxViews)}</span><span>0</span></div>
			<div class="columns">
				{#each days as day (day.date)}
					<div class="column" role="img" aria-label="{dateLabel(day.date)}: {number(day.views)} views" title="{dateLabel(day.date)}: {number(day.views)} views">
						<span class="value">{day.views ? number(day.views) : ''}</span>
						<span class="bar-area"><span class="bar" style:height={height(day.views)}></span></span>
						<span class="day">{day.date.slice(-2)}</span><span class="weekday">{dayName(day.date)}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="empty-chart">Daily view counts will appear here as public pages are visited.</div>
	{/if}
</figure>

<style>
	.views-chart{width:100%;min-width:0;box-sizing:border-box;margin:0;padding:0 16px 15px;overflow:hidden}.views-chart figcaption{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px;color:#294761;font-size:10px;font-weight:700}.views-chart figcaption span+span{color:#8794a0;font-size:9px;font-weight:500}.chart-layout{display:grid;grid-template-columns:32px minmax(0,1fr);gap:8px;min-width:0;max-width:100%}.scale{height:155px;display:flex;flex-direction:column;justify-content:space-between;padding:14px 0 24px;text-align:right;color:#8b98a4;font-size:8px}.columns{height:155px;min-width:0;display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:clamp(3px,1vw,9px);align-items:stretch;background:repeating-linear-gradient(to bottom,transparent 0,transparent 46px,#edf1f4 47px,#edf1f4 48px);border-bottom:1px solid #dfe7ec}.column{min-width:0;display:grid;grid-template-rows:15px minmax(0,1fr) 14px 13px;justify-items:center;gap:2px}.value{font-size:8px;color:#60788c;white-space:nowrap;overflow:hidden;max-width:100%}.bar-area{width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center}.bar{display:block;width:min(23px,80%);min-height:0;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#4d9c87,#2e678e);transition:height .25s ease}.column:hover .bar{background:#1d5276}.day{font-size:8px;color:#607488}.weekday{font-size:7px;color:#8d99a4;white-space:nowrap}.empty-chart{min-height:110px;display:grid;place-items:center;border:1px dashed #dce5eb;border-radius:7px;color:#7f8d99;font-size:10px;text-align:center;padding:18px}.column:focus-visible{outline:2px solid #3479cb;outline-offset:2px}@media(max-width:520px){.views-chart{padding-right:10px;padding-left:10px}.chart-layout{grid-template-columns:25px minmax(0,1fr);gap:5px}.columns{gap:2px}.value{font-size:7px}.weekday{font-size:6px}.day{font-size:7px}}@media(prefers-reduced-motion:reduce){.bar{transition:none}}
</style>
