declare global {
    interface Window {
        Stripe?: (key: string) => {
            elements: (options?: Record<string, unknown>) => {
                create: (type: string, options?: Record<string, unknown>) => {
                    mount: (target: HTMLElement) => void;
                    on: (event: string, handler: (event?: Record<string, unknown>) => void) => void;
                    unmount?: () => void;
                    destroy?: () => void;
                };
            };
            confirmCardPayment: (clientSecret: string, options: Record<string, unknown>) => Promise<{
                error?: { message?: string };
                paymentIntent?: { id?: string; status?: string };
            }>;
        };
    }
}

export {};
