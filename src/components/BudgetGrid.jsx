import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatMoney } from '../data/catalog.js';

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

const initialAmount = (amount) => Math.round(Number(amount || 0) * .30);
const midwayAmount = (amount) => Math.round(Number(amount || 0) * .40);

export default function BudgetGrid({ vendors = [], dates = {}, escrowStatus = 'Awaiting funding' }) {
  // Each vendor row owns its own allocation. The final 30% absorbs rounding
  // differences so that all three checkpoints always sum back to the offer.
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

  return <section className="budget-grid-shell">
    <div className="budget-grid-topline">
      <div><span className="eyebrow">TRANSACTION LEDGER</span><h3 className="serif-heading">Every line, accounted for.</h3></div>
      <div className="ledger-seal"><CheckCircle2 size={14} /><span>Live allocation</span></div>
    </div>
    <div className="ag-grid-wrap">
      <AgGridReact
        theme={escrowTheme}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={{ sortable: true, resizable: true, suppressMovable: true, wrapHeaderText: true, autoHeaderHeight: true }}
        getRowId={({ data }) => data.id}
        domLayout="normal"
        rowHeight={54}
        headerHeight={48}
        animateRows={false}
        suppressCellFocus
        overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>Select a vendor to create your ledger.</span>"
      />
    </div>
    <div className="ledger-footnote">
      <ShieldCheck size={13} />
      <span>Vendor-level allocation · 30% initial · 40% midway · 30% final</span>
      <span className="ledger-currency">USD · CLIENT-SIDE DEMO</span>
    </div>
  </section>;
}
