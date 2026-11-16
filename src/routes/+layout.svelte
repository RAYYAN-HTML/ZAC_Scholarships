<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { BookOpenCheck, Menu, X, ArrowUpRight } from '@lucide/svelte';
	import { afterNavigate } from '$app/navigation';

	let { children }: LayoutProps = $props();
	let menuOpen = $state(false);
	afterNavigate(({ to }) => {
		if (!to || to.url.pathname === '/admin' || to.url.pathname.startsWith('/admin/')) return;
		fetch('/api/analytics/view', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ path: to.url.pathname })
		}).catch((cause) => console.error('[analytics] Could not record page view', cause));
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="site-shell">
	<div class="topline"><span class="live-dot"></span> Verified opportunities for ambitious students</div>
	<header class="site-header">
		<a class="brand" href="/" aria-label="ZAC home"><span class="brand-mark"><BookOpenCheck size={21} strokeWidth={2.2} /></span><span>ZAC<span class="brand-period">.</span><small>Scholarship portal</small></span></a>
		<button class="menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>{#if menuOpen}<X size={22}/>{:else}<Menu size={22}/>{/if}</button>
		<nav class:open={menuOpen} aria-label="Main navigation">
			<a href="/scholarships" onclick={() => menuOpen = false}>Scholarships</a>
			<a href="/about" onclick={() => menuOpen = false}>About ZAC</a>
			<a href="/faq" onclick={() => menuOpen = false}>FAQs</a>
			<a href="/contact" onclick={() => menuOpen = false}>Contact</a>
			<a class="nav-cta" href="/feedback" onclick={() => menuOpen = false}>Share feedback <ArrowUpRight size={15}/></a>
		</nav>
	</header>
	<main>{@render children()}</main>
	<footer class="site-footer"><div class="footer-top"><a class="brand footer-brand" href="/"><span class="brand-mark"><BookOpenCheck size={19}/></span><span>ZAC<span class="brand-period">.</span><small>Scholarship portal</small></span></a><p>Clear opportunities. Confident futures.</p><div class="footer-links"><a href="/about">About</a><a href="/faq">FAQs</a><a href="/contact">Contact</a><a href="/feedback">Feedback</a></div></div><div class="footer-bottom"><span>© 2026 ZAC Scholarship Portal</span><span>Always verify details with the official provider.</span><a href="/admin/login">Admin</a></div></footer>
</div>
