<script lang="ts">
	import { enhance } from '$app/forms';
	import { BookOpenCheck, LayoutDashboard, ClipboardList, MessageSquareText, LogOut, Menu, X } from '@lucide/svelte';
	let { children, data } = $props();
	let open = $state(false);
	function closeMenu() { open = false; }
	function handleKeydown(event: KeyboardEvent) { if (event.key === 'Escape') closeMenu(); }
</script>

<svelte:head><meta name="robots" content="noindex,nofollow" /></svelte:head>
<svelte:window onkeydown={handleKeydown} />
{#if data.admin}
	<div class="admin-shell">
		{#if open}<button class="sidebar-backdrop" aria-label="Close admin navigation" onclick={closeMenu}></button>{/if}
		<aside class:open>
			<div class="sidebar-heading">
				<a href="/admin" class="admin-brand" onclick={closeMenu}><span><BookOpenCheck size={18} /></span><b>ZAC <small>ADMIN</small></b></a>
				<button class="sidebar-close" onclick={closeMenu} aria-label="Close admin navigation"><X size={20} /></button>
			</div>
			<nav>
				<a href="/admin" onclick={closeMenu}><LayoutDashboard size={16} />Overview</a>
				<a href="/admin/scholarships" onclick={closeMenu}><ClipboardList size={16} />Scholarships</a>
				<a href="/admin/feedback" onclick={closeMenu}><MessageSquareText size={16} />Feedback</a>
			</nav>
			<form method="POST" action="/admin?/logout" use:enhance class="logout"><button><LogOut size={15} />Sign out</button></form>
		</aside>
		<div class="admin-main">
			<header><button class="admin-menu" onclick={() => open = !open} aria-label={open ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={open}>{#if open}<X size={20} />{:else}<Menu size={20} />{/if}</button><span>ZAC / Administration</span><div class="admin-user"><i>{data.admin.name.slice(0, 1).toUpperCase()}</i>{data.admin.name}</div></header>
			<main>{@render children()}</main>
		</div>
	</div>
{:else}{@render children()}{/if}

<style>
	.admin-shell{display:flex;min-height:560px;background:#f4f7f9}.admin-shell aside{width:220px;background:#112f4b;color:white;padding:18px 13px;display:flex;flex-direction:column;flex:none}.sidebar-heading{display:flex;align-items:flex-start;justify-content:space-between}.admin-brand{display:flex;align-items:center;gap:9px;color:white;padding:4px 7px 24px;font:800 17px Manrope,sans-serif}.admin-brand>span{width:31px;height:31px;border-radius:8px;background:#fff1;color:#b6d8cb;display:grid;place-items:center}.admin-brand small{font:700 8px 'DM Sans',sans-serif;color:#9cb5c5;letter-spacing:.08em;margin-left:5px}.sidebar-close{display:none;border:0;background:#ffffff14;color:#eaf2f7;border-radius:7px;width:34px;height:34px;place-items:center;cursor:pointer}.admin-shell nav{display:grid;gap:4px}.admin-shell nav a,.logout button{display:flex;align-items:center;gap:10px;padding:10px;border-radius:6px;color:#c6d3dc;font-size:11px}.admin-shell nav a:hover,.admin-shell nav a:focus{background:#ffffff14;color:white}.logout{margin-top:auto;border-top:1px solid #ffffff20;padding-top:14px}.logout button{background:none;border:0;cursor:pointer;width:100%;text-align:left}.admin-main{flex:1;min-width:0}.admin-main>header{height:54px;border-bottom:1px solid #e7edf1;background:white;display:flex;align-items:center;padding:0 23px;color:#84909e;font-size:10px}.admin-user{margin-left:auto;display:flex;align-items:center;gap:7px;color:#4d6276;font-weight:600}.admin-user i{font-style:normal;width:26px;height:26px;border-radius:50%;background:#e6f0ed;color:#36775d;display:grid;place-items:center}.admin-main>main{padding:25px;max-width:1240px}.admin-menu{display:none;border:0;background:none;color:#31536c;cursor:pointer}.sidebar-backdrop{display:none}
	@media(max-width:720px){.admin-shell aside{position:fixed;z-index:12;left:-240px;top:0;bottom:0;width:min(280px,calc(100vw - 56px));box-sizing:border-box;transition:left .2s}.admin-shell aside.open{left:0}.sidebar-close{display:grid}.sidebar-backdrop{display:block;position:fixed;inset:0;z-index:11;border:0;background:rgb(12 28 42 / 42%);cursor:pointer}.admin-menu{display:grid;place-items:center;margin-right:12px}.admin-main>main{padding:17px;box-sizing:border-box;width:100%;min-width:0}.admin-main>header{padding:0 14px}}
	@media(prefers-reduced-motion:reduce){.admin-shell aside{transition:none}}
</style>
