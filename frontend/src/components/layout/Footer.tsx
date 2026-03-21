import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-emerald-500/10 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm">
            Built on Starknet
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <Link href="/marketplace" className="hover:text-emerald-400 transition-colors">
              Marketplace
            </Link>
            <Link href="/create" className="hover:text-emerald-400 transition-colors">
              Create Agent
            </Link>
            <a 
              href="https://starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Starknet
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
