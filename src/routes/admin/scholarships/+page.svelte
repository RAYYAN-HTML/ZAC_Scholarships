<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowRight, BadgeCheck, Plus, Search, ShieldAlert } from '@lucide/svelte';
	import ActionToast from '$lib/components/ActionToast.svelte';
	let { data, form } = $props();
	const labels = { pending_verification: 'Pending verification', verified: 'Verified', needs_reverification: 'Needs re-verification', expired: 'Expired', rejected: 'Rejected' };
	function date(value: string | Date) { return new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }); }
	function toggleAll(event: Event) {
		const checked = (event.currentTarget as HTMLInputElement).checked;
		document.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((input) => input.checked = checked);
	}
	function confirmBulkAction(event: SubmitEvent) {
		const mode = (event.submitter as HTMLButtonElement | null)?.value;
		const message = mode === 'publish'
			? 'Publish all selected verified scholarships? They will become visible in the public directory.'
			: mode === 'verify'
				? 'Mark all selected scholarships as verified? Confirm you reviewed each official source and its current details.'
				: 'Move all selected scholarships to drafts? They will no longer appear publicly.';
		if (!window.confirm(message)) event.preventDefault();
	}
</script>

<svelte:head><title>Manage scholarships | ZAC Admin</title></svelte:head>
<div class="page-title"><div><span class="eyebrow">Content management</span><h1>Scholarships</h1><p>Review official sources and keep listings up to date.</p></div><a class="button button-primary" href="/admin/scholarships/new"><Plus size={14}/> Add scholarship</a></div>
{#if form?.error}<ActionToast type="error" title="Action not completed" message={form.error}/>{/if}
{#if form?.success}<ActionToast title="Changes saved" message="The scholarship changes were saved."/>{/if}
{#if !data.databaseConfigured || data.databaseError}<div class="admin-alert"><ShieldAlert size={17}/><span><b>{data.databaseConfigured ? 'Could not load listings' : 'Database not configured'}</b><small>{data.databaseConfigured ? 'Check the server logs and database connection.' : 'Set DATABASE_URL and run database migrations.'}</small></span></div>{/if}
<div class="list-tools">
	<form class="search-form" method="GET"><label><Search size={15}/><input name="q" value={data.query} placeholder="Search by scholarship or provider"/><button>Search</button></label></form>
	<form id="bulk-actions" class="bulk-form" method="POST" action="?/bulkAction" use:enhance onsubmit={confirmBulkAction}>
		<button class="button button-outline" type="submit" name="mode" value="verify">Verify selected</button>
		<button class="button button-primary" type="submit" name="mode" value="publish">Publish selected</button>
		<button class="button button-outline" type="submit" name="mode" value="draft">Move selected to drafts</button>
	</form>
</div>
<div class="table-shell"><table><thead><tr><th><input type="checkbox" aria-label="Select all scholarships on this page" onchange={toggleAll}/></th><th>Scholarship</th><th>Verification</th><th>Listing status</th><th>Last updated</th><th></th></tr></thead><tbody>
	{#each data.rows as row}<tr>
		<td><input form="bulk-actions" type="checkbox" name="ids" value={row.id} aria-label="Select {row.title}"/></td>
		<td><div class="listing-name"><span><b>{row.title}</b><small>{row.provider} · {row.country}</small></span></div></td>
		<td><span class="badge {row.verificationStatus === 'verified' ? 'good' : ''}">{labels[row.verificationStatus]}</span></td>
		<td><form method="POST" action="?/status" use:enhance><input type="hidden" name="id" value={row.id}/><input type="hidden" name="field" value="publicationStatus"/><select name="value" value={row.publicationStatus} onchange={(event)=>event.currentTarget.form?.requestSubmit()} aria-label="Listing status"><option value="draft">Draft</option><option value="published" disabled={row.verificationStatus !== 'verified'}>Published</option><option value="archived">Archived</option></select></form></td>
		<td class="date-cell">{date(row.updatedAt)}</td><td><a class="edit-link" href="/admin/scholarships/{row.id}/edit">Review <ArrowRight size={13}/></a></td>
	</tr>{/each}
	{#if data.rows.length === 0}<tr><td colspan="6" class="empty-table">{data.query ? 'No scholarships match this search.' : 'No scholarship listings yet.'}</td></tr>{/if}
</tbody></table></div>
<p class="table-foot"><BadgeCheck size={13}/> Bulk actions accept up to 1,000 selected listings. Verification and publication still require an official source; verified listings stay drafts until published.</p>

<style>
	.page-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.page-title .eyebrow{font-size:9px}.page-title h1{font:800 23px Manrope,sans-serif;color:#193c5a;letter-spacing:-.04em;margin:4px 0}.page-title p{font-size:10px;color:#7c8a98;margin:0}.page-title .button{font-size:10px;padding:10px 13px}.list-tools{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.bulk-form{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin:0 0 12px}.search-form{margin:0 0 12px}.search-form label{display:flex;align-items:center;gap:8px;background:white;border:1px solid #e4eaf0;border-radius:7px;padding:5px 6px 5px 11px;color:#8a98a5;max-width:380px}.search-form input{border:0;outline:0!important;flex:1;min-width:0;font-size:10px;padding:7px 0}.search-form button{border:0;border-radius:5px;background:#153b5c;color:white;font-size:9px;padding:8px 12px;cursor:pointer}.bulk-form .button{font-size:9px;padding:8px 10px;white-space:nowrap}.table-shell{background:#fff;border:1px solid #e7edf1;border-radius:8px;overflow:auto}table{border-collapse:collapse;width:100%;min-width:720px;text-align:left}th{font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:#8592a0;background:#fafbfd;padding:11px 13px;font-weight:700}td{padding:12px 13px;border-top:1px solid #f0f2f5;font-size:10px;color:#526a7e}.listing-name{display:flex;align-items:center;gap:9px}.listing-name span{min-width:0}.listing-name b,.listing-name small{display:block}.listing-name b{font-size:10px;color:#34516a}.listing-name small{color:#8694a0;font-size:9px;margin-top:3px}.badge{display:inline-flex;border-radius:10px;padding:5px 7px;background:#f6f1e7;color:#8c794f;font-size:8px}.badge.good{background:#eaf5ef;color:#548269}td select{border:1px solid #e7ebef;border-radius:5px;padding:6px;color:#53687a;font-size:9px;background:#fff}th input,td>input{accent-color:#285c7e}.date-cell{white-space:nowrap;color:#82909d;font-size:9px}.edit-link{display:inline-flex;align-items:center;gap:4px;color:#376785;font-size:9px;font-weight:700;white-space:nowrap}.empty-table{text-align:center;padding:32px;color:#8794a1}.table-foot{display:flex;align-items:center;gap:5px;color:#80908d;font-size:9px;margin:11px 0}.admin-alert{display:flex;align-items:center;gap:11px;background:#fff8e9;border:1px solid #f0e2bd;border-radius:8px;padding:13px;color:#96783d;margin-bottom:15px}.admin-alert span b{display:block;color:#70592d;font-size:11px}.admin-alert span small{display:block;color:#837653;font-size:9px;margin-top:4px}
	@media(max-width:560px){.page-title{align-items:flex-start;flex-direction:column;gap:11px}.page-title h1{font-size:21px}.list-tools{align-items:stretch;flex-direction:column;gap:0}.bulk-form{justify-content:flex-start}.search-form label{max-width:none}.bulk-form .button{margin:0 0 8px}}
</style>
