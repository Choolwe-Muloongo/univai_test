import type { AccountingCardContent } from './engine';

export type AccountingHintPack = {
  title: string;
  hints: string[];
};

export function buildAccountingHints(content: AccountingCardContent, title: string): AccountingHintPack {
  const data = content.data;
  const text = `${title} ${String(data.tableKind ?? '')} ${content.accountingType}`.toLowerCase();

  if (text.includes('suspense') || text.includes('error')) {
    return {
      title: 'Suspense/accounting error hints',
      hints: [
        'Check which side of the trial balance is smaller.',
        'The suspense entry is placed on the side that is short.',
        'Errors affecting only one side usually involve suspense. Errors with a complete double entry may not affect suspense.',
        'Wrong-side postings usually need a correction for double the amount.',
        'When suspense becomes zero, the error correction work is complete.',
      ],
    };
  }

  if (content.accountingType === 'journal_entry') {
    return {
      title: 'Journal entry hints',
      hints: [
        'Identify the accounts affected before thinking about debit or credit.',
        'Classify each account as asset, liability, equity, income, or expense.',
        'Ask what increased and what decreased.',
        'Apply the normal balance rule.',
        'Total debits must equal total credits.',
      ],
    };
  }

  if (content.accountingType === 'trial_balance') {
    return {
      title: 'Trial balance hints',
      hints: [
        'Assets and expenses usually go to the debit column.',
        'Liabilities, capital, and income usually go to the credit column.',
        'Do not put the same account balance on both sides.',
        'Total both columns carefully.',
        'If the totals differ, look for omissions, wrong-side postings, casting errors, or transpositions.',
      ],
    };
  }

  if (content.accountingType === 'financial_statement' || content.accountingType === 'cash_flow_statement') {
    return {
      title: 'Financial statement hints',
      hints: [
        'Classify the item before placing it in the statement.',
        'Income and expenses affect profit.',
        'Assets, liabilities, and equity affect financial position.',
        'Check whether the figure is an addition or deduction.',
        'Read the final total as a business result, not just a number.',
      ],
    };
  }

  return {
    title: 'Accounting thinking hints',
    hints: [
      'Start with the business event or accounting problem.',
      'Identify the accounts, figures, or judgement involved.',
      'Complete the workpaper one row at a time.',
      'Check totals and classifications.',
      'Explain the result in plain business language.',
    ],
  };
}
