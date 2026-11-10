import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { CheckCircle2, Clock3, RotateCcw, ShieldCheck } from 'lucide-react';
import { formatMoney } from '../data/catalog.js';

ModuleRegistry.registerModules([AllCommunityModule]);

const escrowTheme = themeQuartz.withParams({
  backgroundColor: '#ffffff', foregroundColor: '#292520', headerBackgroundColor: '#f6f1ea',
  headerTextColor: '#71685e', borderColor: '#ebe5dc', rowHoverColor: '#fbf7f1',
  selectedRowBackgroundColor: '#f5efe5', fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 11, headerFontSize: 9, headerFontWeight: 700, cellHorizontalPadding: 12,
  wrapperBorderRadius: 12
});

function StatusPill({ value }) {
  const text = String(value || 'Awaiting funding');
  const refunded = /refund|removed/i.test(text);
  const funded = /captured|escrow|released|demo funding/i.test(text);
  const Icon = refunded ? RotateCcw : funded ? ShieldCheck : Clock3;
  return <span className={`grid-status ${refunded ? 'refunded' : funded ? 'funded' : 'pending'}`}><Icon size={11} />{text}</span>;
}

export default function BudgetGrid({ vendors = [], dates = {}, escrowStatus = 'Awaiting funding' }) {
  const rows = useMemo(() => vendors.map(vendor => ({
    id: vendor.id, service: vendor.serviceLabel || vendor.service, vendor: vendor.name,
    listed: Number(vendor.listedPrice || 0), negotiated: Number(vendor.finalPrice ?? vendor.currentPrice ?? vendor.listedPrice ?? 0),
    strategy: vendor.strategy || 'Bundle leverage pending', releaseDate: dates.releaseDate || 'To be confirmed',
    status: vendor.refundStatus || escrowStatus
  })), [vendors, dates.releaseDate, escrowStatus]);

  const columns = useMemo(() => [
    { field: 'service', headerName: 'SERVICE', minWidth: 105, flex: 0.8 },
    { field: 'vendor', headerName: 'VENDOR PARTNER', minWidth: 145, flex: 1.1 },
    { field: 'listed', headerName: 'LISTED QUOTE', width: 112, valueFormatter: ({ value }) => formatMoney(value), cellClass: 'amount-cell' },
    { field: 'negotiated', headerName: 'PACTAI PRICE', width: 112, valueFormatter: ({ value }) => formatMoney(value), cellClass: 'amount-cell negotiated-cell' },
    { field: 'strategy', headerName: 'NEGOTIATION METHOD', minWidth: 210, flex: 1.3, wrapText: true, autoHeight: true },
    { field: 'releaseDate', headerName: 'RELEASE DATE', width: 110 },
    { field: 'status', headerName: 'LEDGER STATUS', minWidth: 150, cellRenderer: params => <StatusPill value={params.value} /> }
  ], []);

  return <div className="budget-grid-shell">
    <div className="budget-grid-topline"><div><span className="eyebrow">TRANSACTION LEDGER</span><h3 className="serif-heading">Every line, accounted for.</h3></div><div className="ledger-seal"><CheckCircle2 size={14} /> <span>Milestone mapped</span></div></div>
    <div className="ag-grid-wrap"><AgGridReact theme={escrowTheme} rowData={rows} columnDefs={columns} defaultColDef={{ sortable: true, resizable: true, suppressMovable: true }} getRowId={({ data }) => data.id} domLayout="normal" rowHeight={56} headerHeight={40} animateRows suppressCellFocus overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>Select a vendor to create your ledger.</span>" /></div>
    <div className="ledger-footnote"><ShieldCheck size={13} /><span>Vendor-level allocation · one checkout record · milestone release plan</span><span className="ledger-currency">USD · PAYPAL-READY</span></div>
  </div>;
}