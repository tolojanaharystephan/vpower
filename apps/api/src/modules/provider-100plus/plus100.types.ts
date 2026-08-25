export type Plus100AccountType = 'agent' | 'player';

export type Plus100AddAccountInput = {
  type: Plus100AccountType;
  /** Required for agent (7–16 alphanumeric). Omitted for player — 100plus generates an 11-digit account. */
  account?: string;
  password: string;
  name?: string;
  tel?: string;
  desc?: string;
  setScore?: string;
};

export type Plus100EditAccountInput = {
  account: string;
  password?: string;
  name?: string;
  tel?: string;
  desc?: string;
};

export type Plus100AddAccountResult = {
  status: string;
  account: string;
};

export type Plus100AccountDetails = {
  status: string;
  account?: string;
  parentAccount?: string;
  score?: string;
  entries?: string;
  winning?: string;
  revert?: string;
  name?: string;
  tel?: string;
  desc?: string;
};

export type Plus100LaunchResult = {
  status: string;
  clientUrl: string;
};
