import { Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-border py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-text-secondary text-sm">
            Twilight Explorer
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://twilight.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white text-sm flex items-center gap-1"
            >
              Twilight.org
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/twilight-project"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
