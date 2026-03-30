import { FastResponse } from "srvx";

// Nitro on Node can use srvx's optimized response path.
globalThis.Response = FastResponse;
