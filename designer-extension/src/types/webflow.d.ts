interface WebflowUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface WebflowSite {
  id: string;
  name: string;
  shortName: string;
  timezone: string;
}

interface WebflowDesignerExtensionContext {
  user: WebflowUser;
  site: WebflowSite;
}

interface WebflowDesignerExtension {
  mount: (context: WebflowDesignerExtensionContext) => Promise<void>;
}

interface Webflow {
  pushClient: (extension: WebflowDesignerExtension) => void;
}

declare global {
  interface Window {
    Webflow?: Webflow;
  }
}
