"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

export interface LineItemDraft {
  product_id?: string;
  product_name: string;
  description: string;
  qty: string;
  unit_price: string;
}

interface Props {
  items: LineItemDraft[];
  products: Product[];
  onChange: (items: LineItemDraft[]) => void;
  disabled?: boolean;
  currency?: string;
}

const EMPTY_ITEM: LineItemDraft = { product_name: "", description: "", qty: "1", unit_price: "0" };

function ProductCombobox({
  item,
  products,
  onSelect,
  disabled,
  currency,
}: {
  item: LineItemDraft;
  products: Product[];
  onSelect: (patch: Partial<LineItemDraft>) => void;
  disabled?: boolean;
  currency?: string;
}) {
  const [query, setQuery] = useState(item.product_name);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(item.product_name);
  }, [item.product_name]);

  const suggestions = query
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products;

  function handleSelect(product: Product) {
    onSelect({ product_id: product.id, product_name: product.name, unit_price: product.unit_price });
    setQuery(product.name);
    setOpen(false);
  }

  function handleBlur() {
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setOpen(false);
        if (query !== item.product_name) {
          onSelect({ product_id: undefined, product_name: query });
        }
      }
    }, 150);
  }

  return (
    <div className="relative">
      <Input
        className="h-8 text-xs"
        placeholder="Type to search products…"
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {open && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 rounded-md border bg-white shadow-lg max-h-44 overflow-auto text-xs"
        >
          {suggestions.map((p) => (
            <div
              key={p.id}
              className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between gap-2"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
            >
              <span className="font-medium truncate">{p.name}</span>
              <span className="text-slate-400 shrink-0">{formatCurrency(p.unit_price, currency)}/{p.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LineItemsEditor({ items, products, onChange, disabled, currency }: Props) {
  function addItem() {
    onChange([...items, { ...EMPTY_ITEM }]);
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof LineItemDraft, value: string) {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  }

  function handleProductSelect(i: number, patch: Partial<LineItemDraft>) {
    const updated = [...items];
    updated[i] = { ...updated[i], ...patch };
    onChange(updated);
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0),
    0
  );

  return (
    <div>
      {/* ── Desktop table (md+) ─────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b text-slate-500">
              <th className="text-left py-2 pr-3 font-medium w-1/3">Product</th>
              <th className="text-left py-2 pr-3 font-medium">Description</th>
              <th className="text-right py-2 pr-3 font-medium w-20">Qty</th>
              <th className="text-right py-2 pr-3 font-medium w-28">Unit Price</th>
              <th className="text-right py-2 font-medium w-28">Subtotal</th>
              {!disabled && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const lineSubtotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0);
              return (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-3">
                    {!disabled ? (
                      <ProductCombobox
                        item={item}
                        products={products}
                        onSelect={(patch) => handleProductSelect(i, patch)}
                        currency={currency}
                      />
                    ) : (
                      <span className="font-medium">{item.product_name}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {!disabled ? (
                      <Input className="h-8 text-xs" placeholder="Optional description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                    ) : (
                      <span className="text-slate-500">{item.description}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {!disabled ? (
                      <Input className="h-8 text-xs text-right w-20 ml-auto" type="number" min="0.01" step="0.01" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} />
                    ) : (
                      <span>{item.qty}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {!disabled ? (
                      <Input className="h-8 text-xs text-right w-28 ml-auto" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} />
                    ) : (
                      <span>{formatCurrency(item.unit_price, currency)}</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(lineSubtotal, currency)}</td>
                  {!disabled && (
                    <td className="py-2 pl-2">
                      <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards (<md) ──────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {items.map((item, i) => {
          const lineSubtotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0);
          return (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {!disabled ? (
                    <ProductCombobox
                      item={item}
                      products={products}
                      onSelect={(patch) => handleProductSelect(i, patch)}
                      currency={currency}
                    />
                  ) : (
                    <p className="font-medium text-sm text-slate-800">{item.product_name}</p>
                  )}
                </div>
                {!disabled && (
                  <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500 shrink-0 mt-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {!disabled ? (
                <Input className="h-8 text-xs" placeholder="Optional description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
              ) : item.description ? (
                <p className="text-xs text-slate-500">{item.description}</p>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Qty</p>
                  {!disabled ? (
                    <Input className="h-8 text-xs text-right" type="number" min="0.01" step="0.01" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} />
                  ) : (
                    <p className="text-sm text-right">{item.qty}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Unit Price</p>
                  {!disabled ? (
                    <Input className="h-8 text-xs text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} />
                  ) : (
                    <p className="text-sm text-right">{formatCurrency(item.unit_price, currency)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Subtotal</p>
                  <p className="text-sm font-semibold text-right text-slate-800">{formatCurrency(lineSubtotal, currency)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!disabled && (
        <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
          <Plus size={14} className="mr-1" /> Add Line Item
        </Button>
      )}

      <div className="flex justify-end mt-4 pt-4 border-t">
        <div className="text-right">
          <p className="text-sm text-slate-500">Subtotal</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(subtotal, currency)}</p>
        </div>
      </div>
    </div>
  );
}
