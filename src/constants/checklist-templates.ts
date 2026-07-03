export const checklistTemplates: Record<string, string[]> = {
  gst_audit: [
    "Collect GST returns",
    "Download GSTR-1",
    "Download GSTR-3B",
    "Download GSTR-2B",
    "Reconcile GST input",
    "Verify GST output liability",
    "Prepare GST working paper",
    "Manager review",
  ],

  tax_audit: [
    "Collect trial balance",
    "Ledger scrutiny",
    "Bank reconciliation",
    "Fixed asset verification",
    "Depreciation working",
    "Related party transaction check",
    "Prepare audit report",
    "Partner review",
  ],

  internal_audit: [
    "Understand process flow",
    "Collect internal control documents",
    "Verify sample transactions",
    "Identify control gaps",
    "Prepare observation sheet",
    "Discuss with management",
    "Prepare internal audit report",
  ],

  statutory_audit: [
    "Collect financial statements",
    "Verify ledgers",
    "Bank balance confirmation",
    "Debtor/Creditor verification",
    "Fixed asset check",
    "Prepare audit working",
    "Final review",
  ],

  roc_compliance: [
    "Collect company master data",
    "Check statutory registers",
    "Verify board meeting records",
    "Prepare ROC forms",
    "Review attachments",
    "File ROC return",
  ],

  itr: [
    "Collect Form 16 / income details",
    "Verify AIS/TIS",
    "Check deductions",
    "Compute tax liability",
    "Prepare ITR",
    "Review and file return",
  ],

  tds: [
    "Collect TDS challans",
    "Verify deduction details",
    "Prepare return data",
    "Validate FVU",
    "File TDS return",
    "Download acknowledgement",
  ],

  accounting: [
    "Collect source documents",
    "Pass accounting entries",
    "Bank reconciliation",
    "Ledger review",
    "Prepare financial statements",
  ],

  other: [
    "Collect required information",
    "Perform assigned work",
    "Prepare working note",
    "Submit for review",
  ],
};
