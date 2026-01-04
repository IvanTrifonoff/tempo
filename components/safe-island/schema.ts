import { z } from 'zod';

// --- Allowed Values Whitelists ---

const VariantSchema = z.enum([
  'primary', 
  'secondary', 
  'outline', 
  'ghost', 
  'danger',
  'h1', 'h2', 'h3', 'body', 'caption'
]);

const LayoutSchema = z.enum([
  'col', 'row', 'grid'
]);

const PaddingSchema = z.enum([
  'none', 'small', 'medium', 'large'
]);

// --- Component Schemas ---

const BaseNodeSchema = z.object({
  id: z.string(),
  // Styles are logical, mapped to classes in Renderer
  style: z.object({
    padding: PaddingSchema.optional(),
    margin: PaddingSchema.optional(),
    background: z.string().regex(/^bg-[a-z]+-\d+$/, "Invalid background class").optional(), // Only simple tailwind bg classes
    shadow: z.boolean().optional(),
    width: z.enum(['full', 'auto', '1/2', '1/3']).optional(),
  }).optional(),
});

export const SafeTextSchema = BaseNodeSchema.extend({
  type: z.literal('text'),
  props: z.object({
    content: z.string(),
    variant: z.enum(['h1', 'h2', 'h3', 'body', 'caption']).default('body'),
    align: z.enum(['left', 'center', 'right']).optional(),
  }),
});

export const SafeButtonSchema = BaseNodeSchema.extend({
  type: z.literal('button'),
  props: z.object({
    label: z.string(),
    variant: z.enum(['primary', 'secondary', 'danger', 'ghost']).default('primary'),
    icon: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
  actionId: z.string().optional(),
});

export const SafeImageSchema = BaseNodeSchema.extend({
  type: z.literal('image'),
  props: z.object({
    src: z.string().url(),
    alt: z.string(),
    aspectRatio: z.enum(['square', 'video', 'portrait']).optional(),
  }),
});

export const SafeIconSchema = BaseNodeSchema.extend({
  type: z.literal('icon'),
  props: z.object({
    name: z.string(), // Verified against Icons export in Renderer
    color: z.enum(['white', 'yellow', 'gray', 'red']).optional(),
  }),
});

// Recursive Container Schema
export const SafeContainerSchema: z.ZodType<any> = BaseNodeSchema.extend({
  type: z.literal('container'),
  props: z.object({
    layout: LayoutSchema.default('col'),
    gap: z.enum(['none', 'small', 'medium', 'large']).default('small'),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between']).optional(),
  }),
  children: z.lazy(() => z.array(SafeNodeSchema)),
});

// Union of all possible nodes
export const SafeNodeSchema = z.discriminatedUnion('type', [
  SafeContainerSchema,
  SafeTextSchema,
  SafeButtonSchema,
  SafeImageSchema,
  SafeIconSchema
]);

export const SafeManifestSchema = z.object({
  featureId: z.string(),
  version: z.string(),
  root: SafeNodeSchema,
});

export type SafeNode = z.infer<typeof SafeNodeSchema>;
export type SafeManifest = z.infer<typeof SafeManifestSchema>;
