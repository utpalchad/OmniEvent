import React, { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { CheckCircle2, ShieldCheck, CircleDollarSign, Info } from 'lucide-react';
import { formatMoney } from '../data/catalog.js';
import { supabase } from '../lib/supabase.js';

ModuleRegistry.registerModules([AllCommunityModule]);

const escrowTheme = themeQuartz.withParams({
  backgroundColor: '#fffdf8',
  foregroundColor: '#29382f',
  headerBackgroundColor: '#f3f0e8',
  headerTextColor: '#6f786f',
  borderColor: '#e8e1d5',
  rowHoverColor: '#f7f4ed',
  selectedRowBackgroundColor: '#eef2eb',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 11,
  headerFontSize: 9,
  headerFontWeight: 700,
  cellHorizontalPadding: 12,
  wrapperBorderRadius: 12
});

const initialAmount = amount => Math.round(Number(amount || 0) * .30);
const midwayAmount = amount => Math.round(Number(amount || 0) * .40);

export default function BudgetGrid({ vendors = [], dates = {}, escrowStatus = 'Awaiting funding' }) {
  const [transactions, setTransactions] = useState([]);
  const [transactionMessage, setTransactionMessage] = useState('Loading simulated demo ledger…');

  useEffect(() => {
    if (!supabase) {
      setTransactionMessage('Supabase is not configured.');
      return undefined;
    }

    let active = true;
    supabase
      .from('demo_payment_ledger')
      .select('id,transaction_kind,milestone_key,amount_minor,currency_code,status,escrow_state,demo_reference,notes,created_at,is_simulated')
      .eq('is_simulated', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setTransactionMessage('Demo transaction history could not be loaded: ' + error.message);
          setTransactions([]);
          return;
        }
        setTransactions(data || []);
        setTransactionMessage(data?.length ? '' : 'No simulated transaction rows yet. Run the PactAI demo seed function.');
      });

    return () => { active = false; };
  }, []);

  // Each vendor row owns its own allocation. The final 30% absorbs rounding
  // differences so that all three checkpoints sum back to the offer.
  const rows = useMemo(() => vendors.map(vendor => {
    const negotiated = Number(vendor.finalPrice ?? vendor.currentPrice ?? vendor.listedPrice ?? 0);
    const initial = initialAmount(negotiated);
    const midway = midwayAmount(negotiated);
    return {
      id: vendor.id,
      category: vendor.serviceLabel || vendor.service,
      vendor: vendor.name,
      listed: Number(vendor.listedPrice || 0),
      negotiated,
      initial,
      midway,
      final: negotiated - initial - midway
    };
  }), [vendors]);

  const moneyColumn = (field, headerName, flex = 1) => ({
    field, headerName, minWidth: 112, flex,
    valueFormatter: ({ value }) => formatMoney(value),
    cellClass: 'amount-cell'
  });

  const columns = useMemo(() => [
    { field: 'category', headerName: 'CATEGORY', minWidth: 145, flex: 1.2 },
    { field: 'vendor', headerName: 'VENDOR', minWidth: 155, flex: 1.35 },
    moneyColumn('listed', 'LISTED QUOTE', 1),
    { ...moneyColumn('negotiated', 'NEGOTIATED OFFER', 1), cellClass: 'amount-cell negotiated-cell' },
    moneyColumn('initial', '30% INITIAL', .9),
    moneyColumn('midway', '40% MIDWAY', .9),
    moneyColumn('final', '30% FINAL', .9)
  ], []);

  const transactionColumns = useMemo(() => [
    { field: 'transaction_kind', headerName: 'TYPE', minWidth: 92, flex: .7 },
    { field: 'milestone_key', headerName: 'MILESTONE', minWidth: 140, flex: 1 },
    {
      field: 'amount_minor',
      headerName: 'AMOUNT',
      minWidth: 125,
      flex: .9,
      valueFormatter: ({ value, data }) => formatMoney(Number(value || 0) / 100, data?.currency_code || 'INR'),
      cellClass: 'amount-cell'
    },
    { field: 'status', headerName: 'STATUS', minWidth: 112, flex: .8 },
    { field: 'escrow_state', headerName: 'DEMO HOLD STATE', minWidth: 165, flex: 1.2 },
    { field: 'demo_reference', headerName: 'DEMO REFERENCE', minWidth: 215, flex: 1.45 },
    {
      field: 'created_at',
      headerName: 'RECORDED',
      minWidth: 145,
      flex: 1,
      valueFormatter: ({ value }) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
    }
  ], []);

  const defaultColDef = {
    sortable: true,
    resizable: true,
    suppressMovable: true,
    wrapHeaderText: true,
    autoHeaderHeight: true
  };

  return <section className="budget-grid-shell">
    <div className="budget-grid-topline">
      <div><span className="eyebrow">FINANCIAL ALLOCATION</span><h3 className="serif-heading">Every line, accounted for.</h3></div>
      <div className="ledger-seal"><CheckCircle2 size={14} /><span>30 / 40 / 30 plan</span></div>
    </div>
    <div className="ag-grid-wrap">
      <AgGridReact
        theme={escrowTheme}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => data.id}
        domLayout="normal"
        rowHeight={54}
        headerHeight={48}
        animateRows={false}
        suppressCellFocus
        overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>Select a vendor to create your allocation.</span>"
      />
    </div>
    <div className="ledger-footnote">
      <ShieldCheck size={13} />
      <span>Vendor allocation · 30% initial · 40% midway · 30% final</span>
      <span className="ledger-currency">INR · PLANNING ESTIMATE</span>
    </div>

    <div className="budget-grid-topline demo-ledger-heading">
      <div><span className="eyebrow">PAYPAL SANDBOX · DEMONSTRATION ONLY</span><h3 className="serif-heading">Sample transaction activity.</h3></div>
      <div className="ledger-seal"><CircleDollarSign size={14} /><span>{transactions.length} demo entries</span></div>
    </div>
    <div className="demo-ledger-notice">
      <Info size={14} />
      <span>These are simulated ledger rows for the hackathon walkthrough—not PayPal-created orders, payout batches, captured payments or escrow. Provider IDs are intentionally blank.</span>
    </div>
    <div className="ag-grid-wrap demo-transaction-grid">
      <AgGridReact
        theme={escrowTheme}
        rowData={transactions}
        columnDefs={transactionColumns}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => data.id}
        domLayout="normal"
        rowHeight={48}
        headerHeight={48}
        animateRows={false}
        suppressCellFocus
        overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>No simulated transaction rows.</span>"
      />
    </div>
    {transactionMessage && <p className="muted-copy" role="status">{transactionMessage}</p>}
    <div className="ledger-footnote">
      <ShieldCheck size={13} />
      <span>Sandbox data is illustrative only; real PayPal Orders/Payouts require verified test merchant accounts and server-side API calls.</span>
      <span className="ledger-currency">{escrowStatus}</span>
    </div>
  </section>;
}
