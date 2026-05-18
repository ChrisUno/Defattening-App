import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
import { errorHandler } from '../errorHandler.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('error with message → 500 + { message: "..." }', () => {
    const err = new Error('Something broke');
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something broke' });
  });

  it('error without message → 500 + "Internal server error"', () => {
    const err = new Error();
    err.message = ''; // empty message
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
