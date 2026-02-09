import Link from 'next/link';

export function InfoFooter() {
  return (
    <section className="border-t border-card-border/60 py-[29px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-[15.8px] leading-[24px] mb-2">
            Explorer Mechanics
          </h3>
          <p className="text-text-secondary text-[12.3px] leading-[18px]">
            Data is indexed continuously and refreshed in near real-time. Blocks and transactions
            are pulled from Twilight APIs and served through the explorer backend.
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold text-[15.8px] leading-[24px] mb-2">
            Data Sources
          </h3>
          <p className="text-text-secondary text-[12.3px] leading-[18px]">
            Sources include the explorer REST API, WebSocket streaming, and the Twilight LCD for
            specific network data.
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold text-[15.8px] leading-[24px] mb-2">Need Help?</h3>
          <p className="text-text-secondary text-[12.3px] leading-[18px] mb-2">
            Check documentation or join Discord for support and updates.
          </p>
          <Link
            href="https://twilight.org"
            className="text-primary hover:text-primary-light underline text-[12.3px] leading-[18px]"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Documentation →
          </Link>
        </div>
      </div>
    </section>
  );
}

