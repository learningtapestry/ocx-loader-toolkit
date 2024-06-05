export default function ColorDotWithNumber({color, number=null}: {color: string, number?: number | null}) {
  return <div style={{display: 'inline-block'}}>
    <svg width="12" height="12">
      <circle cx="6" cy="7" r="4" fill={color} stroke={color} strokeWidth="1" />
    </svg>
    { number && <span style={{marginLeft: 2}}>{number}</span> }
  </div>
}
