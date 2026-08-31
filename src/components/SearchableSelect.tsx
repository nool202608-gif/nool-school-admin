'use client';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export interface SearchableOption {
  value: string;
  label: string;
}

/**
 * A type-to-search dropdown, styled to sit flush with this app's plain
 * `.field` inputs/selects (a bare-bones MUI Autocomplete otherwise looks
 * visually foreign next to them). Swap this in for any native `<select>`
 * whose option list is driven by a real, growing dataset (classes,
 * teachers, subjects...) rather than a small fixed enum (status filters,
 * Bloom levels, question types) - typing to filter stops being optional
 * once a list can realistically exceed a screenful.
 */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required = false,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selected}
      disabled={disabled}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      onChange={(_event, next) => onChange(next?.value ?? '')}
      slotProps={{ popper: { style: { zIndex: 1400 } } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          required={required && !value}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              padding: '0 !important',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              fontSize: 'var(--fs-base)',
              '& fieldset': { borderColor: 'var(--color-line)' },
              '&:hover fieldset': { borderColor: 'var(--color-line)' },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--color-primary)',
                borderWidth: '1px',
              },
            },
            '& .MuiAutocomplete-input': {
              padding: '8px 12px !important',
            },
          }}
        />
      )}
    />
  );
}
