// Polyfill `global` for libraries that expect a Node.js environment (e.g. Razorpay, SockJS)
(window as any).global = window;
(window as any).process = { env: {} };
