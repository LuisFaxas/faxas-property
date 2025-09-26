import { App } from 'firebase-admin/app';

declare global {
  var adminApp: App | undefined;
}

export {};