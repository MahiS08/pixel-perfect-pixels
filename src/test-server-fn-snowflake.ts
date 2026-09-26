import { createServerFn } from "@tanstack/react-start";
import snowflake from "snowflake-sdk";
export const getStats = createServerFn({ method: 'GET' }).handler(async () => { return 1; });
