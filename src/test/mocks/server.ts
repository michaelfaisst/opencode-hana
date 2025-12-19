import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server instance for Node.js environment (tests)
 */
export const server = setupServer(...handlers);
