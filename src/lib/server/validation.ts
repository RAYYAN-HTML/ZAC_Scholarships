import { z } from 'zod';

const secureUrl = z.string().trim().url().max(1000).refine((value) => new URL(value).protocol === 'https:', 'Use a secure HTTPS URL');
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const optionalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; }, 'Enter a real calendar date')]).optional();

export const feedbackSchema = z.object({ category: z.enum(['Eligibility question', 'Deadline or status question', 'Incorrect scholarship details', 'Broken application link', 'Missing scholarship', 'Website experience', 'Scholarship information', 'Accessibility', 'Suggestion', 'Other']), message: z.string().trim().min(10, 'Please add a little more detail (at least 10 characters).').max(2000), email: z.union([z.string().trim().email('Enter a valid email address.').max(254), z.literal('')]).optional().transform((value) => value || null) });
export const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) });
export const directoryFilterSchema = z.object({
	q: z.string().trim().max(120).optional(),
	country: z.string().trim().max(120).optional(),
	degree: z.string().trim().max(120).optional(),
	category: z.string().trim().max(80).optional(),
	funding: z.string().trim().max(80).optional(),
	sort: z.enum(['deadline', 'latest']).optional(),
	page: z.coerce.number().int().min(1).max(1000).default(1)
});
export const scholarshipSchema = z.object({
	title: z.string().trim().min(3).max(240), provider: z.string().trim().min(2).max(240), country: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(80), degreeLevels: z.string().trim().min(2).max(500), fieldsOfStudy: optionalText(2000), description: z.string().trim().min(20).max(6000), eligibility: optionalText(6000), benefits: optionalText(6000), requiredDocuments: optionalText(4000), openingDate: optionalDate, deadline: optionalDate, fundingType: z.string().trim().min(2).max(80), applicationUrl: z.union([secureUrl, z.literal('')]), sourceUrl: z.union([secureUrl, z.literal('')]), verificationStatus: z.enum(['pending_verification', 'verified', 'needs_reverification', 'expired', 'rejected']), applicationStatus: z.enum(['open', 'upcoming', 'closed', 'unconfirmed']), publicationStatus: z.enum(['draft', 'published', 'archived']), reviewNote: optionalText(3000)
}).superRefine((value, context) => {
	if (!value.sourceUrl && value.verificationStatus === 'verified') context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Add an official source URL before marking this listing verified.' });
	if (!value.sourceUrl && value.publicationStatus === 'published') context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Add an official source URL before publishing this listing.' });
});
