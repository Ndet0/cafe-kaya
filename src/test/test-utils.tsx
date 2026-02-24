import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import userEvent from "@testing-library/user-event";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  route?: string;
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}

function createWrapper({ route = "/", routerProps, queryClient }: WrapperOptions = {}) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & WrapperOptions;

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { route, routerProps, queryClient, ...renderOptions } = options;
  const wrapper = createWrapper({ route, routerProps, queryClient });
  return {
    ...render(ui, { wrapper, ...renderOptions }),
    user: userEvent.setup(),
  };
}

export { customRender as render, createTestQueryClient, createWrapper };
export { screen, waitFor, within, act } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
