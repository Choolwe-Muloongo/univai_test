import type { AccountingCardContent } from './engine';

export type AccountingMistakeFeedback = {
  title: string;
  checks: { mistake: string; feedback: string }[];
};

export function buildAccountingMistakeFeedback(content: AccountingCardContent): AccountingMistakeFeedback {
  const type = content.accountingType;
  const tableKind = String(content.data.tableKind ?? '').toLowerCase();

  if (tableKind.includes('suspense') || tableKind.includes('error') || type === 'error_correction') {
    return {
      title: 'How to fix common suspense and error-correction mistakes',
      checks: [
        { mistake: 'Suspense placed on the wrong side', feedback: 'Find the side that is short. Suspense is used to fill that short side temporarily.' },
        { mistake: 'Wrong-side posting corrected with the same amount only', feedback: 'A wrong-side posting usually needs double the amount because you reverse the wrong side and post the correct side.' },
        { mistake: 'Using suspense for every error', feedback: 'Only errors that affect trial balance agreement normally use suspense. Complete double-entry errors may not affect suspense.' },
        { mistake: 'Ignoring profit effect', feedback: 'If the error affects income, expense, inventory, or depreciation, revise profit as well as the account balance.' },
      ],
    };
  }

  if (type === 'journal_entry') {
    return {
      title: 'How to fix common journal mistakes',
      checks: [
        { mistake: 'Debit and credit reversed', feedback: 'Return to account classes. Ask what increased or decreased, then apply normal balance rules.' },
        { mistake: 'Journal is not balanced', feedback: 'Every journal must have equal total debits and credits before it can be posted.' },
        { mistake: 'Wrong account used', feedback: 'Use the business event to identify the exact account, not just a similar account.' },
        { mistake: 'Missing narration', feedback: 'A narration helps explain the reason for the entry and can earn presentation marks.' },
      ],
    };
  }

  if (type === 'trial_balance') {
    return {
      title: 'How to fix common trial balance mistakes',
      checks: [
        { mistake: 'Balance put in the wrong column', feedback: 'Check the account normal balance. Assets and expenses are usually debit; liabilities, capital, and income are usually credit.' },
        { mistake: 'Totals do not agree', feedback: 'Re-add columns, check omissions, check wrong-side postings, and test transposition errors.' },
        { mistake: 'Using account movement instead of closing balance', feedback: 'A trial balance uses the closing balance extracted from each ledger account.' },
      ],
    };
  }

  return {
    title: 'How to fix common accounting mistakes',
    checks: [
      { mistake: 'Filling the table mechanically', feedback: 'Pause and explain why each row belongs in that place.' },
      { mistake: 'Wrong classification', feedback: 'Classify the item first: asset, liability, equity, income, expense, cash flow, tax item, audit risk, or disclosure.' },
      { mistake: 'Correct number but weak explanation', feedback: 'Professional accounting requires both the figure and the reason behind it.' },
    ],
  };
}
