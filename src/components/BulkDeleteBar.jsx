import React from 'react';
import { Trash2, X, CheckSquare } from 'lucide-react';
import Button from './Button';

/**
 * Sticky bar shown while rows are selected, with a bulk delete action.
 *
 * `items` describes what will be removed, used only for the confirm copy. The
 * parent owns the actual API call so it can refresh its list afterwards.
 */
export default function BulkDeleteBar({
  count,
  noun,
  onClear,
  onConfirm,
  busy = false,
  allMode = false,
  onDeleteAll
}) {
  if (count === 0 && !allMode) return null;

  return (
    <div className="sticky top-0 z-20 -mx-3 sm:-mx-5 lg:-mx-8 xl:-mx-10 px-3 sm:px-5 lg:px-8 xl:px-10 py-2.5 bg-[#111111] text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <CheckSquare className="w-4 h-4 text-[#FF5E00] shrink-0" />
        <span>
          {count > 0
            ? `${count} ${noun}${count === 1 ? '' : 's'} selected`
            : 'All records will be deleted'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onDeleteAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteAll}
            disabled={busy}
            className="!bg-transparent !text-white !border-white/30 hover:!border-red-400 hover:!text-red-300 flex-1 sm:flex-none justify-center"
          >
            Delete all
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          icon={Trash2}
          loading={busy}
          disabled={count === 0}
          onClick={onConfirm}
          className="flex-1 sm:flex-none justify-center"
        >
          Delete selected
        </Button>
        {count > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Checkbox cell used in the first column of a selectable table.
 * Clicking it must not trigger the row's own click handler.
 */
export function SelectCell({ checked, onChange, label }) {
  return (
    <td className="py-3 pl-4 pr-1 w-8" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="w-3.5 h-3.5 rounded border-[#EDEDED] text-[#FF5E00] focus:ring-[#FF5E00] cursor-pointer align-middle"
      />
    </td>
  );
}

/** Header cell holding the select-all checkbox. */
export function SelectAllCell({ checked, indeterminate, onChange, total }) {
  return (
    <th className="py-3 pl-4 pr-1 w-8">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate) && !checked;
        }}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={`Select all ${total} rows on this page`}
        title="Select all rows on this page"
        className="w-3.5 h-3.5 rounded border-[#EDEDED] text-[#FF5E00] focus:ring-[#FF5E00] cursor-pointer align-middle"
      />
    </th>
  );
}