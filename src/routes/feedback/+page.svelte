<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Send } from '@lucide/svelte';
	import ActionToast from '$lib/components/ActionToast.svelte';

	let { form } = $props();
	let category = $state('Website experience');
	let message = $state('');
	let email = $state('');
	const quickTopics = [
		{ label: 'Eligibility question', category: 'Eligibility question', prompt: 'I have a question about eligibility for: ' },
		{ label: 'Deadline or status', category: 'Deadline or status question', prompt: 'I have a question about the deadline or status for: ' },
		{ label: 'Incorrect details', category: 'Incorrect scholarship details', prompt: 'The scholarship details that seem incorrect are: ' },
		{ label: 'Broken application link', category: 'Broken application link', prompt: 'The application link for this scholarship appears to be broken: ' },
		{ label: 'Missing scholarship', category: 'Missing scholarship', prompt: 'A scholarship that may be missing from ZAC is: ' }
	] as const;
	function chooseTopic(topic: (typeof quickTopics)[number]) {
		category = topic.category;
		message = topic.prompt;
	}
</script>

<svelte:head>
	<title>Feedback and questions | ZAC</title>
	<meta name="description" content="Ask a scholarship question, report incorrect information, or share feedback with ZAC." />
	<meta property="og:title" content="Feedback and questions | ZAC" />
	<meta property="og:description" content="Ask a scholarship question or help us improve ZAC." />
	<meta property="og:type" content="website" />
</svelte:head>

<section class="feedback-head">
	<div class="container"><span class="eyebrow">Questions and suggestions</span><h1>How can we help?</h1><p>Choose a common topic or send us a note. Email is optional; leave it blank to send without contact details.</p></div>
</section>

<section class="feedback-body">
	<div class="container">
		<a href="/" class="back"><ArrowLeft size={14} /> Back to ZAC</a>
		<div class="feedback-layout">
			<aside class="quick-help" aria-labelledby="quick-help-title">
				<span class="eyebrow">Quick answers</span><h2 id="quick-help-title">Before you send</h2>
				<details><summary>Can ZAC confirm that I’m eligible?</summary><p>ZAC can help you read the listed criteria, but the scholarship provider makes the final eligibility decision. Check the official source linked on the scholarship page.</p></details>
				<details><summary>Where do I apply?</summary><p>Open the scholarship details and use “Apply on official website.” ZAC does not collect applications.</p></details>
				<details><summary>What if a deadline or link looks wrong?</summary><p>Choose the matching topic and include the scholarship name or page link so the team can review it.</p></details>
				<details><summary>Will I get a reply?</summary><p>A reply is not guaranteed. You may leave an email if you would like an administrator to contact you.</p></details>
			</aside>

			<form method="POST" use:enhance class="feedback-form">
				<div class="form-heading"><div><span class="eyebrow">Help us improve</span><h2>Send a message</h2></div><div class="privacy-note">Email is optional</div></div>
				{#if form?.success}<ActionToast title="Feedback sent" message="Thanks for helping us make ZAC better." />{/if}
				{#if form?.error}<ActionToast type="error" message={form.error} />{/if}
				<div class="field"><span class="field-label">Common topics</span><div class="topic-list">{#each quickTopics as topic}<button type="button" class="topic-chip" onclick={() => chooseTopic(topic)}>{topic.label}</button>{/each}</div></div>
				<div class="field"><label class="field-label" for="category">What is this about?</label><select class="form-control" id="category" name="category" bind:value={category} required><option value="Eligibility question">Eligibility question</option><option value="Deadline or status question">Deadline or status question</option><option value="Incorrect scholarship details">Incorrect scholarship details</option><option value="Broken application link">Broken application link</option><option value="Missing scholarship">Missing scholarship</option><option value="Website experience">Website experience</option><option value="Scholarship information">Scholarship information</option><option value="Accessibility">Accessibility</option><option value="Suggestion">Suggestion</option><option value="Other">Other</option></select></div>
				<div class="field"><label class="field-label" for="message">Your question or feedback</label><textarea class="form-control" id="message" name="message" rows="6" maxlength="2000" minlength="10" placeholder="Include the scholarship name or page link if it helps." bind:value={message} required></textarea><div class="help-text">Please don’t include passwords, identity documents, or application materials.</div></div>
				<div class="field"><label class="field-label" for="email">Email address <span class="optional">(optional)</span></label><input class="form-control" id="email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" bind:value={email} /><div class="help-text">Only administrators can see it. We’ll use it only if we need to follow up; a reply is not guaranteed.</div></div>
				<button class="button button-primary" type="submit">Send message <Send size={14} /></button>
			</form>
		</div>
	</div>
</section>

<style>
	.feedback-head{padding:40px 0 32px;background:#edf3f5}.feedback-head h1{font:800 32px Manrope,sans-serif;letter-spacing:-.05em;color:#173a59;margin:9px 0 6px}.feedback-head p{font-size:12px;color:#6a7d8e;margin:0;line-height:1.7}.feedback-body{padding:24px 0}.back{display:inline-flex;align-items:center;gap:5px;color:#64798b;font-size:10px}.feedback-layout{display:grid;grid-template-columns:minmax(230px,.8fr) minmax(0,1.4fr);align-items:start;gap:18px;margin:17px auto 20px;max-width:900px}.quick-help,.feedback-form{background:#fff;border:1px solid #e8edf1;border-radius:10px;padding:21px;box-shadow:0 5px 18px #102d4d08}.quick-help h2,.form-heading h2{font:700 17px Manrope,sans-serif;color:#23425e;margin:5px 0 14px}.quick-help details{border-top:1px solid #edf1f4;padding:12px 0}.quick-help summary{font-size:11px;font-weight:700;color:#34536c;cursor:pointer;line-height:1.5}.quick-help details p{font-size:10px;line-height:1.7;color:#6d7f90;margin:8px 0 0}.feedback-form{min-width:0}.form-heading{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;margin-bottom:15px;border-bottom:1px solid #edf1f4}.form-heading h2{margin-bottom:0}.privacy-note{border:1px solid #e5eee9;background:#f5f9f6;color:#5a846f;font-size:9px;border-radius:5px;padding:7px 9px}.field{margin-bottom:14px}.field-label{display:block;color:#43566a;font-size:11px;font-weight:700;margin-bottom:6px}.optional{font-weight:500;color:#82909c}.form-control{width:100%;border:1px solid #dfe6ee;border-radius:7px;padding:11px 12px;background:#fff;color:#26384a;font-size:12px}.topic-list{display:flex;gap:6px;flex-wrap:wrap}.topic-chip{border:1px solid #dce7ed;border-radius:999px;background:#f7fafb;padding:7px 9px;color:#375b74;font-size:9px;font-weight:600;cursor:pointer}.topic-chip:hover,.topic-chip:focus-visible{background:#eaf3f5;border-color:#b9d1d9}.help-text{font-size:10px;color:#78889a;margin-top:5px;line-height:1.6}.feedback-form textarea{resize:vertical}.feedback-form .button{font-size:11px}@media(max-width:700px){.feedback-layout{grid-template-columns:1fr}.feedback-head{padding:32px 0 24px}.feedback-head h1{font-size:27px}.feedback-form,.quick-help{padding:17px}.form-heading{align-items:flex-start;gap:10px}}
</style>
