<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertCircle, CheckCircle2, Info, X } from '@lucide/svelte';

	let {
		type = 'success',
		title,
		message
	}: {
		type?: 'success' | 'error' | 'info';
		title?: string;
		message: string;
	} = $props();

	let visible = $state(true);
	onMount(() => {
		if (type !== 'success') return;
		const timeout = window.setTimeout(() => (visible = false), 7000);
		return () => window.clearTimeout(timeout);
	});

	const heading = $derived(title ?? (type === 'success' ? 'Done' : type === 'error' ? 'Couldn’t complete that' : 'Notice'));
</script>

{#if visible}
	<div class="action-toast {type}" role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
		<span class="toast-icon" aria-hidden="true">
			{#if type === 'success'}<CheckCircle2 size={19} />{:else if type === 'error'}<AlertCircle size={19} />{:else}<Info size={19} />{/if}
		</span>
		<span class="toast-copy"><b>{heading}</b><span>{message}</span></span>
		<button type="button" aria-label="Dismiss notification" onclick={() => (visible = false)}><X size={16} /></button>
	</div>
{/if}

<style>
	.action-toast{position:fixed;z-index:1000;top:118px;right:clamp(16px,3vw,36px);display:grid;grid-template-columns:22px 1fr 28px;align-items:start;gap:11px;width:min(410px,calc(100vw - 32px));padding:15px 13px 15px 15px;border:1px solid;border-radius:12px;background:#fff;box-shadow:0 16px 48px #102d4d24;animation:toast-in .24s cubic-bezier(.2,.75,.25,1) both}
	.action-toast.success{border-color:#cce8db;color:#27704f}.action-toast.error{border-color:#f0d1ce;color:#a34139}.action-toast.info{border-color:#d4e3f1;color:#315f8d}
	.toast-icon{display:grid;place-items:center;margin-top:1px}.toast-copy{display:grid;gap:3px;min-width:0}.toast-copy b{color:#183a56;font-size:12px;line-height:1.4}.toast-copy>span{color:#607488;font-size:11px;line-height:1.55;overflow-wrap:anywhere}
	.action-toast button{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:#718294;cursor:pointer}.action-toast button:hover{background:#f0f4f7;color:#203f5d}.action-toast button:focus-visible{outline:3px solid #8dbaf0;outline-offset:2px}
	@keyframes toast-in{from{opacity:0;transform:translate3d(0,-8px,0) scale(.98)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
	@media(max-width:600px){.action-toast{top:calc(78px + env(safe-area-inset-top));right:12px;width:calc(100vw - 24px)}}
	@media(prefers-reduced-motion:reduce){.action-toast{animation:none}}
</style>
