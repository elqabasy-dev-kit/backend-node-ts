import { ErrorCode, MyError } from "../types/error.type";

export const MONEY_MINOR_UNIT_SCALE = 100;

export function normalizeMoneyInput(value: number): number {
  if (!Number.isInteger(value)) {
    throw new MyError({
      code: ErrorCode.INVALID_TRANSACTION_AMOUNT,
      message: "Transaction amounts must be integer minor units",
    });
  }

  return value;
}
