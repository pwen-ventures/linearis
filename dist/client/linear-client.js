import { LinearClient } from "@linear/sdk";
export class LinearSdkClient {
    sdk;
    constructor(apiToken) {
        this.sdk = new LinearClient({ apiKey: apiToken });
    }
}
