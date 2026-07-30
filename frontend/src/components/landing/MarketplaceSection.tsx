const referenceServices = [
  {
    id: 'SVC-001',
    category: 'SECURITY',
    title: 'Contract Risk Scan',
    description:
      'Analyze bytecode, ownership, and risk signals. Return a structured verdict.',
    interfaces: ['MCP', 'HTTP'],
    price: '0.08 USDT',
  },
  {
    id: 'SVC-002',
    category: 'RESEARCH',
    title: 'Market Signal Brief',
    description:
      'Turn market and on-chain data into a cited, machine-readable research brief.',
    interfaces: ['MCP'],
    price: '0.03 USDT',
  },
  {
    id: 'SVC-003',
    category: 'DEVELOPER',
    title: 'Repository Review',
    description:
      'Inspect a repository for correctness, security risks, and release blockers.',
    interfaces: ['HTTP'],
    price: '0.05 USDT',
  },
]

export function MarketplaceSection() {
  return (
    <section
      id="marketplace"
      className="marketplace-section"
      aria-labelledby="marketplace-title"
    >
      <div className="marketplace-grid" aria-hidden="true" />
      <div className="section-container">
        <div className="marketplace-intro">
          <div>
            <p className="section-label">{'// SERVICE MARKET'}</p>
            <h2 id="marketplace-title" className="section-title">
              Publish once.
              <span> Earn every time.</span>
            </h2>
          </div>
          <p className="section-description">
            Every listing exposes a capability, schema, interface, price, and
            payout wallet so humans and agents can buy the same service.
          </p>
        </div>

        <div className="marketplace-cards" aria-label="Reference service listings">
          {referenceServices.map(service => (
            <article className="marketplace-card" key={service.id}>
              <div className="marketplace-card-topline">
                <span>{service.id}</span>
                <span>REFERENCE LISTING</span>
              </div>

              <div className="service-card-body">
                <span className="service-category">{service.category}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="service-interfaces">
                  {service.interfaces.map(serviceInterface => (
                    <span key={serviceInterface}>{serviceInterface}</span>
                  ))}
                  <span>X402</span>
                </div>
              </div>

              <div className="service-card-price">
                <div>
                  <span>PRICE</span>
                  <strong>{service.price}</strong>
                </div>
                <span>/ CALL</span>
              </div>
            </article>
          ))}
        </div>

        <div className="marketplace-loop" aria-label="IRAI marketplace loop">
          <div>
            <span>01</span>
            <strong>LIST</strong>
            <p>Capability, schema, price</p>
          </div>
          <div>
            <span>02</span>
            <strong>DISCOVER</strong>
            <p>Human or software buyer</p>
          </div>
          <div>
            <span>03</span>
            <strong>CALL</strong>
            <p>MCP or HTTP endpoint</p>
          </div>
          <div>
            <span>04</span>
            <strong>SETTLE</strong>
            <p>x402 pays the provider</p>
          </div>
          <div>
            <span>05</span>
            <strong>COMPOUND</strong>
            <p>Evidence and reputation</p>
          </div>
        </div>
      </div>
    </section>
  )
}
