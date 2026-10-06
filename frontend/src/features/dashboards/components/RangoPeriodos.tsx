import type { RangoPeriodo } from './series';

export function RangoPeriodos({ etiqueta, opciones, valor, onChange, disabled = false }: {
  etiqueta: string;
  opciones: number[];
  valor: RangoPeriodo;
  onChange: (valor: RangoPeriodo) => void;
  disabled?: boolean;
}) {
  return <fieldset className="grid min-w-0 grid-cols-2 gap-3" disabled={disabled || !opciones.length}>
    <legend className="mb-2 text-sm font-semibold text-slate-700">{etiqueta}</legend>
    {(['desde', 'hasta'] as const).map((limite, indice) => (
      <label key={limite} className="text-xs text-slate-600">
        {limite === 'desde' ? 'Desde' : 'Hasta'}
        <select aria-label={`${etiqueta} ${limite}`} value={valor[indice]}
          onChange={(event) => {
            const nuevo = event.target.value === 'todos' ? 'todos' : Number(event.target.value);
            let [desde, hasta] = valor;
            if (indice === 0) desde = nuevo; else hasta = nuevo;
            if (desde !== 'todos' && hasta !== 'todos' && desde > hasta) {
              if (indice === 0) hasta = desde; else desde = hasta;
            }
            onChange([desde, hasta]);
          }} className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-[#0A192F] disabled:opacity-60">
          <option value="todos">{indice === 0 ? 'Primero disponible' : 'Último disponible'}</option>
          {opciones.map((periodo) => <option key={periodo} value={periodo}>{periodo}</option>)}
        </select>
      </label>
    ))}
  </fieldset>;
}
