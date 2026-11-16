<script lang="ts">
	import { ArrowRight, BadgeCheck, Clock3, Eye, Globe2, Plus, ShieldAlert } from '@lucide/svelte';
	let { data } = $props();
	const fmt = (value: string | Date) => new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
	const number = (value: number) => new Intl.NumberFormat('en-PK').format(value);
</script>

<svelte:head><title>Admin overview | ZAC</title></svelte:head>

<div class="admin-title">
	<div><span class="eyebrow">Overview</span><h1>Good to see you.</h1><p>A clear view of what needs attention.</p></div>
	<a class="button button-primary" href="/admin/scholarships/new"><Plus size={15}/> Add scholarship</a>
</div>

{#if !data.databaseConfigured}
	<div class="admin-alert"><ShieldAlert size={19}/><span><b>Database not configured</b><small>Set DATABASE_URL and run database migrations before managing listings.</small></span></div>
{:else if data.databaseError}
	<div class="admin-alert"><ShieldAlert size={19}/><span><b>Could not load dashboard data</b><small>Check the server logs and database connection.</small></span></div>
{/if}

<div class="stat-grid">
	<div class="stat-card"><span class="stat-icon"><Globe2 size={17}/></span><span><small>Total listings</small><b>{number(data.stats.total)}</b></span></div>
	<div class="stat-card"><span class="stat-icon good"><BadgeCheck size={17}/></span><span><small>Published</small><b>{number(data.stats.published)}</b></span></div>
	<div class="stat-card"><span class="stat-icon warn"><Clock3 size={17}/></span><span><small>Pending verification</small><b>{number(data.stats.pending)}</b></span></div>
	<div class="stat-card"><span class="stat-icon bad"><Clock3 size={17}/></span><span><small>Expired</small><b>{number(data.stats.expired)}</b></span></div>
</div>

<section class="analytics-card">
	<div class="recent-head">
		<div><h2>Site activity</h2><p>Public page views · popular scholarships from the last 30 days</p></div>
		<span class="privacy-label"><Eye size={13}/> Aggregate only</span>
	</div>
	{#if data.analyticsError}
		<p class="analytics-warning">
			{#if data.analyticsProblem === 'migration'}
				The analytics table is missing. Run <code>pnpm db:migrate</code> in the app environment. Scholarship data remains available; view counts start after migration.
			{:else if data.analyticsProblem === 'config'}
				Site activity is unavailable because the database connection is not configured.
			{:else}
				Site activity could not be loaded from the database. Check the server logs and try again.
			{/if}
		</p>
	{:else}
	<div class="analytics-layout">
		<div class="traffic-summary">
			<div class="stat-icon"><Eye size={17}/></div>
			<div><small>Views today</small><b>{number(data.stats.pageViewsToday)}</b></div>
			<div class="week-total"><small>Last 7 days</small><b>{number(data.stats.pageViewsLast7Days)}</b></div>
		</div>
		<div class="popular-list">
			<h3>Most viewed scholarships</h3>
			{#if data.popular.length}
				<ol>{#each data.popular as item}<li><a href="/scholarships/{item.slug}">{item.title}</a><span>{number(item.views)} views</span></li>{/each}</ol>
			{:else}
				<p class="recent-empty">No scholarship views yet. Public visits will appear here.</p>
			{/if}
		</div>
	</div>
	<p class="privacy-note">Counts page views, not unique people. No visitor identity or IP address is saved.</p>
	{/if}
</section>

<section class="recent-card">
	<div class="recent-head"><div><h2>Recently updated</h2><p>The latest changes to scholarship listings.</p></div><a href="/admin/scholarships">Manage all <ArrowRight size={14}/></a></div>
	{#if data.recent.length}
		<div class="recent-list">{#each data.recent as item}<div class="recent-row"><span class="recent-title"><b>{item.title}</b><small>{item.provider}</small></span><span class="recent-status {item.verificationStatus === 'verified' ? 'is-good' : ''}">{item.verificationStatus.replaceAll('_', ' ')}</span><span class="recent-date">{fmt(item.updatedAt)}</span><a href="/admin/scholarships/{item.id}/edit" aria-label="Edit {item.title}"><ArrowRight size={15}/></a></div>{/each}</div>
	{:else}
		<div class="recent-empty">No listings yet. Add a scholarship from an official provider source to begin.</div>
	{/if}
</section>

<style>
	.admin-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.admin-title .eyebrow{font-size:9px}.admin-title h1{font:800 23px Manrope,sans-serif;letter-spacing:-.04em;color:#193c5a;margin:4px 0}.admin-title p{font-size:10px;color:#7c8a98;margin:0}.admin-title .button{font-size:10px;padding:10px 13px}
	.admin-alert{display:flex;align-items:center;gap:11px;background:#fff8e9;border:1px solid #f0e2bd;border-radius:8px;padding:13px;color:#96783d;margin-bottom:15px}.admin-alert span b{display:block;color:#70592d;font-size:11px}.admin-alert span small{display:block;color:#837653;font-size:9px;margin-top:4px}
	.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.stat-card{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid #e7edf1;border-radius:8px;padding:14px}.stat-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:#edf3f7;color:#4c7895;flex:none}.stat-icon.good{background:#edf6f0;color:#4c9674}.stat-icon.warn{background:#fbf5e9;color:#b18b44}.stat-icon.bad{background:#fbefed;color:#b66b60}.stat-card small,.traffic-summary small{display:block;color:#8391a0;font-size:9px}.stat-card b,.traffic-summary b{display:block;font:700 20px Manrope,sans-serif;color:#264561;margin-top:3px}
	.analytics-card,.recent-card{background:#fff;border:1px solid #e7edf1;border-radius:8px;margin-top:17px}.recent-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #edf1f4}.recent-head h2{font:700 13px Manrope,sans-serif;color:#294761;margin:0}.recent-head p{font-size:9px;color:#83909c;margin:4px 0 0}.recent-head>a{display:flex;align-items:center;gap:5px;color:#386984;font-size:9px;font-weight:700}.privacy-label{display:flex;align-items:center;gap:5px;color:#548269;background:#edf6f0;border-radius:12px;padding:5px 8px;font-size:8px;white-space:nowrap}
	.analytics-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:18px;padding:14px 16px}.traffic-summary{display:flex;align-items:center;gap:11px;background:#f7f9fa;border:1px solid #edf1f4;border-radius:7px;padding:13px}.week-total{margin-left:auto;padding-left:13px;border-left:1px solid #e4e9ed}.traffic-summary b{font-size:18px}.popular-list h3{font:700 11px Manrope,sans-serif;color:#294761;margin:1px 0 8px}.popular-list ol{list-style:none;margin:0;padding:0}.popular-list li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #f0f2f5}.popular-list li a{font-size:9px;font-weight:600;color:#375169;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.popular-list li a:hover{color:#3479cb}.popular-list li span{font-size:8px;color:#7b8997;white-space:nowrap}.privacy-note{font-size:8px;color:#8794a0;padding:0 16px 11px;margin:0}.recent-row{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f0f2f5}.recent-row:last-child{border:0}.recent-title{flex:1;min-width:0}.recent-title b{display:block;font-size:10px;color:#375169;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recent-title small{display:block;font-size:9px;color:#8895a1;margin-top:3px}.recent-status{background:#f4f1eb;color:#937d50;border-radius:12px;padding:4px 7px;font-size:8px;text-transform:capitalize}.recent-status.is-good{background:#eaf5ef;color:#548269}.recent-date{font-size:9px;color:#8a98a3;white-space:nowrap}.recent-row>a{color:#8293a0}.recent-empty{padding:24px;color:#7d8c9b;text-align:center;font-size:10px}
	.analytics-warning{padding:15px 16px;margin:0;color:#806a3d;background:#fffbf1;font-size:9px}
	@media(max-width:760px){.stat-grid{grid-template-columns:repeat(2,1fr)}.analytics-layout{grid-template-columns:1fr}.recent-date{display:none}}
	@media(max-width:520px){.admin-title{align-items:flex-start;gap:12px;flex-direction:column}.admin-title h1{font-size:21px}.stat-card{padding:10px}.stat-card b{font-size:18px}.recent-row{padding:11px 10px;gap:6px}.recent-status{font-size:7px}.recent-head{padding:12px}.privacy-label{font-size:0}.privacy-label :global(svg){width:15px;height:15px}}
</style>
