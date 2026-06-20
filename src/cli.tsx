import { render } from '@react-pdf/renderer';
import type { CliProgram } from 'argsbarg';
import { CliOptionKind, cliErrWithHelp, cliRun, isInteractiveTty } from 'argsbarg';
import React from 'react';
import { parseInvoiceJson } from './parser.ts';
import * as templates from './templates';

/** Entrypoint for the CLI. */
const root = {
  key: 'invoice-pdf-gen',
  description: 'Generate an invoice PDF from JSON on stdin',
  options: [
    {
      name: 'output',
      description: 'Path to write the PDF file',
      kind: CliOptionKind.String,
      shortName: 'o',
      required: true,
    },
    {
      name: 'template',
      description: 'Which template to use (e.g. modern, ...)',
      kind: CliOptionKind.String,
      shortName: 't',
      required: false,
    },
  ],
  /**
   * Reads invoice JSON from stdin, chooses a template, and writes the PDF to `--output`.
   */
  async handler(ctx) {
    if (isInteractiveTty) {
      cliErrWithHelp(
        ctx,
        'stdin must be piped (interactive TTY). Example: bun src/index.ts --output invoice.pdf < invoice.json',
      );
    }

    const outputPath = ctx.stringOpt('output');
    if (!outputPath) {
      cliErrWithHelp(ctx, 'missing required option: --output / -o');
    }

    const templateName = ctx.stringOpt('template') || 'modern';
    const Template = templates[templateName as keyof typeof templates];

    const raw = await new Response(Bun.stdin).text();
    let invoice;
    try {
      invoice = parseInvoiceJson(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      cliErrWithHelp(ctx, msg);
    }

    await render(<Template data={invoice} />, outputPath);
  },
} satisfies CliProgram;

/**
 * Parses argv and runs the invoice PDF CLI (does not return on success).
 */
export async function runCli(): Promise<never> {
  return cliRun(root);
}
