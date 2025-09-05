import { NEIGHBORHOODS } from '../constants/neighborhoods'

type Props = {
  value?: string
  onChange?: (value: string) => void
}

function NeighborhoodSelect({ value, onChange }: Props) {
  return (
    <select
      className="w-full rounded-lg border px-3 py-2"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">Mahalle seçin</option>
      {NEIGHBORHOODS.map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  )
}

export default NeighborhoodSelect


