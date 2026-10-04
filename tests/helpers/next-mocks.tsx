import { vi } from 'vitest';

// Shared stand-ins for Next.js navigation in component tests; reset them in `beforeEach`.
export const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() };
export const navigationState = { pathname: '/', searchParams: new URLSearchParams() };

export function resetNavigationMocks(): void {
  for (const method of Object.values(routerMock)) {
    method.mockReset();
  }
  navigationState.pathname = '/';
  navigationState.searchParams = new URLSearchParams();
}

type MockLinkProps = React.ComponentProps<'a'> & {
  href: string;
  onNavigate?: (event: { preventDefault: () => void }) => void;
};

// Behaves like `next/link` for tests: calls `onNavigate`, and navigates through the router unless it was prevented.
export function MockLink({ href, onNavigate, children, ...props }: MockLinkProps) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        const navigation = { isPrevented: false };
        onNavigate?.({
          preventDefault: () => {
            navigation.isPrevented = true;
          },
        });
        if (!navigation.isPrevented) {
          routerMock.push(href);
        }
      }}
    >
      {children}
    </a>
  );
}

// The `next/navigation` module with the router hooks swapped for the mocks above; everything else stays real.
export function createNavigationModule(actual: object): object {
  return {
    ...actual,
    useRouter: () => routerMock,
    usePathname: () => navigationState.pathname,
    useSearchParams: () => navigationState.searchParams,
  };
}
