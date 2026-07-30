const commerceSteps = [
  {
    number: '01',
    label: 'Discover',
    detail: 'market.search()',
  },
  {
    number: '02',
    label: 'Call',
    detail: 'service.invoke()',
  },
  {
    number: '03',
    label: 'Settle',
    detail: 'x402 / BOT USDT',
  },
  {
    number: '04',
    label: 'Earn',
    detail: 'provider.wallet',
  },
]

export function CommerceTrace() {
  return (
    <div
      className="commerce-trace"
      aria-label="A service is discovered, called, settled through x402, and paid to its provider"
    >
      {commerceSteps.map((step, index) => (
        <div className="commerce-trace-item" key={step.number}>
          <div className="commerce-trace-step">
            <span className="commerce-trace-number">{step.number}</span>
            <span className="commerce-trace-label">{step.label}</span>
            <code>{step.detail}</code>
          </div>
          {index < commerceSteps.length - 1 ? (
            <span className="commerce-trace-connector" aria-hidden="true">
              &gt;
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
